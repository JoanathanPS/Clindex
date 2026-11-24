-- 0004 — Signed e-prescriptions, per-item dispense ledger, hash-chained audit.
--
-- Mirrors packages/rx-core (the tested reference implementation):
--   * a prescription (rx_tokens + rx_items) is immutable once registered;
--   * dispense_events is append-only and written ONLY through
--     dispense_rx_item(), which locks the item row so concurrent pharmacies
--     can never dispense more than was authorised;
--   * other pharmacies see balances, never who dispensed where;
--   * every dispense is appended to a SHA-256 hash chain.
-- Signatures are verified (Ed25519) in the edge function that registers a
-- token, before it reaches these tables.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.prescribers (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles (id) on delete set null,
    name text not null,
    registration_no text not null,
    council text not null,
    verified_at timestamptz,
    created_at timestamptz not null default now(),
    unique (registration_no, council)
);

create table public.signing_keys (
    kid text primary key,
    prescriber_id uuid not null references public.prescribers (id) on delete cascade,
    public_key text not null,
    created_at timestamptz not null default now(),
    revoked_at timestamptz
);

create table public.pharmacies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    licence_no text not null unique,
    pincode text check (pincode ~ '^[1-9][0-9]{5}$'),
    owner_id uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

create table public.rx_tokens (
    id text primary key,
    kid text not null references public.signing_keys (kid),
    patient_hash text not null,
    issued_at timestamptz not null,
    expires_at timestamptz not null,
    token text not null,
    created_at timestamptz not null default now(),
    check (expires_at > issued_at)
);

create table public.rx_items (
    rx_id text not null references public.rx_tokens (id) on delete cascade,
    item_no int not null check (item_no > 0),
    drug text not null,
    generics text[] not null default '{}',
    qty_authorized int not null check (qty_authorized > 0),
    unit text,
    no_substitution boolean not null default false,
    controlled text,
    expires_at timestamptz not null,
    primary key (rx_id, item_no)
);

create table public.dispense_events (
    id bigint generated always as identity primary key,
    rx_id text not null,
    item_no int not null,
    qty int not null check (qty > 0),
    pharmacy_id uuid not null references public.pharmacies (id),
    dispensed_drug text not null,
    substituted boolean not null default false,
    online boolean not null default true,
    created_at timestamptz not null default now(),
    foreign key (rx_id, item_no) references public.rx_items (rx_id, item_no)
);
create index dispense_events_item_idx on public.dispense_events (rx_id, item_no);

create table public.audit_chain (
    seq bigint primary key,
    at timestamptz not null default now(),
    actor text not null,
    action text not null,
    data jsonb not null default '{}'::jsonb,
    prev_hash text not null,
    hash text not null unique
);

-- ============================================================================
-- Audit chain
-- ============================================================================

create function public.audit_hash(p_seq bigint, p_at timestamptz, p_actor text, p_action text, p_data jsonb, p_prev text)
returns text
language sql
immutable
as $$
    select encode(sha256(convert_to(
        concat_ws('|', p_seq::text, to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), p_actor, p_action, p_data::text, p_prev),
        'UTF8')), 'hex');
$$;

create function public.append_audit(p_actor text, p_action text, p_data jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_prev text;
    v_seq bigint;
    v_at timestamptz := now();
begin
    -- Serialise appends so the chain never forks.
    perform pg_advisory_xact_lock(7340201);
    select seq + 1, hash into v_seq, v_prev from public.audit_chain order by seq desc limit 1;
    v_seq := coalesce(v_seq, 0);
    v_prev := coalesce(v_prev, 'genesis');
    insert into public.audit_chain (seq, at, actor, action, data, prev_hash, hash)
    values (v_seq, v_at, p_actor, p_action, p_data, v_prev, public.audit_hash(v_seq, v_at, p_actor, p_action, p_data, v_prev));
    return v_seq;
end;
$$;

-- Returns the first seq whose hash or link does not verify, or null if intact.
create function public.verify_audit_chain()
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    r record;
    v_prev text := 'genesis';
    v_expected bigint := 0;
begin
    for r in select * from public.audit_chain order by seq loop
        if r.seq <> v_expected
           or r.prev_hash <> v_prev
           or r.hash <> public.audit_hash(r.seq, r.at, r.actor, r.action, r.data, r.prev_hash) then
            return r.seq;
        end if;
        v_prev := r.hash;
        v_expected := v_expected + 1;
    end loop;
    return null;
end;
$$;

-- ============================================================================
-- Dispensing
-- ============================================================================

create function public.dispense_rx_item(
    p_rx_id text,
    p_item_no int,
    p_qty int,
    p_pharmacy_id uuid,
    p_dispensed_drug text default null,
    p_substituted boolean default false,
    p_online boolean default true
)
returns table (event_id bigint, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item public.rx_items%rowtype;
    v_used int;
    v_left int;
    v_id bigint;
begin
    if not exists (
        select 1 from public.pharmacies p
        where p.id = p_pharmacy_id
          and (p.owner_id = auth.uid() or public.current_user_role() = 'admin')
    ) then
        raise exception 'not_pharmacy_member' using errcode = '42501';
    end if;

    if p_qty is null or p_qty <= 0 then
        raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    -- The row lock serialises concurrent dispenses of the same line.
    select * into v_item from public.rx_items
    where rx_id = p_rx_id and item_no = p_item_no
    for update;
    if not found then
        raise exception 'unknown_item' using errcode = 'P0002';
    end if;

    if exists (
        select 1 from public.rx_tokens t join public.signing_keys k on k.kid = t.kid
        where t.id = p_rx_id and k.revoked_at is not null and k.revoked_at <= t.issued_at
    ) then
        raise exception 'revoked_key' using errcode = '42501';
    end if;

    select coalesce(sum(qty), 0) into v_used from public.dispense_events
    where rx_id = p_rx_id and item_no = p_item_no;
    v_left := v_item.qty_authorized - v_used;

    if v_left <= 0 then
        raise exception 'fully_dispensed' using errcode = '23514';
    elsif p_qty > v_left then
        raise exception 'exceeds_remaining:%', v_left using errcode = '23514';
    elsif now() > v_item.expires_at then
        raise exception 'item_expired' using errcode = '23514';
    elsif v_item.controlled is not null and not p_online then
        raise exception 'controlled_requires_online' using errcode = '23514';
    elsif p_substituted and v_item.no_substitution then
        raise exception 'substitution_not_allowed' using errcode = '23514';
    end if;

    insert into public.dispense_events (rx_id, item_no, qty, pharmacy_id, dispensed_drug, substituted, online)
    values (p_rx_id, p_item_no, p_qty, p_pharmacy_id, coalesce(p_dispensed_drug, v_item.drug), p_substituted, p_online)
    returning id into v_id;

    perform public.append_audit(
        'pharmacy:' || p_pharmacy_id::text,
        'dispense',
        jsonb_build_object('rx', p_rx_id, 'item', p_item_no, 'qty', p_qty, 'substituted', p_substituted, 'online', p_online)
    );

    return query select v_id, v_left - p_qty;
end;
$$;

-- What any pharmacy may see: balances per line, never who dispensed where.
create function public.rx_item_balances(p_rx_id text)
returns table (item_no int, drug text, qty_authorized int, remaining int, controlled text, no_substitution boolean, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
    select i.item_no, i.drug, i.qty_authorized,
           i.qty_authorized - coalesce((select sum(e.qty) from public.dispense_events e where e.rx_id = i.rx_id and e.item_no = i.item_no), 0)::int,
           i.controlled, i.no_substitution, i.expires_at
    from public.rx_items i
    where i.rx_id = p_rx_id
      and (public.current_user_role() in ('pharmacist', 'admin')
           or exists (select 1 from public.pharmacies p where p.owner_id = auth.uid()))
    order by i.item_no;
$$;

-- ============================================================================
-- Row-level security
-- ============================================================================

alter table public.prescribers enable row level security;
alter table public.signing_keys enable row level security;
alter table public.pharmacies enable row level security;
alter table public.rx_tokens enable row level security;
alter table public.rx_items enable row level security;
alter table public.dispense_events enable row level security;
alter table public.audit_chain enable row level security;

-- Public key directory: anyone may verify a signature.
create policy signing_keys_read on public.signing_keys for select to anon, authenticated using (true);
create policy prescribers_read on public.prescribers for select to authenticated using (true);
create policy pharmacies_read on public.pharmacies for select to authenticated using (true);
create policy pharmacies_owner on public.pharmacies for all to authenticated
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Prescriptions: the issuing prescriber, pharmacists and admins.
create policy rx_tokens_read on public.rx_tokens for select to authenticated using (
    public.current_user_role() in ('pharmacist', 'admin')
    or exists (select 1 from public.signing_keys k join public.prescribers p on p.id = k.prescriber_id
               where k.kid = rx_tokens.kid and p.profile_id = auth.uid())
);
create policy rx_items_read on public.rx_items for select to authenticated using (
    exists (select 1 from public.rx_tokens t where t.id = rx_items.rx_id)
);

-- Ledger: a pharmacy sees its own events; admins see all. Writes go through
-- dispense_rx_item() only (no insert/update/delete policies).
create policy dispense_events_own on public.dispense_events for select to authenticated using (
    public.current_user_role() = 'admin'
    or exists (select 1 from public.pharmacies p where p.id = dispense_events.pharmacy_id and p.owner_id = auth.uid())
);

create policy audit_chain_admin on public.audit_chain for select to authenticated using (public.current_user_role() = 'admin');

revoke all on function public.append_audit(text, text, jsonb) from public;
revoke all on function public.dispense_rx_item(text, int, int, uuid, text, boolean, boolean) from public;
revoke all on function public.rx_item_balances(text) from public;
revoke all on function public.verify_audit_chain() from public;
grant execute on function public.dispense_rx_item(text, int, int, uuid, text, boolean, boolean) to authenticated;
grant execute on function public.rx_item_balances(text) to authenticated;
grant execute on function public.verify_audit_chain() to authenticated;
