"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@clindex/find";
import { catalog } from "@/lib/catalog";

export function MedicineSearch({
  onSelect,
  placeholder = "Search a brand or salt, e.g. Dolo 650 or Metformin",
  autoFocus = false,
}: {
  onSelect: (hit: SearchHit) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.replace(/[^a-z0-9]/gi, "").length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      catalog
        .search(q, 10)
        .then((h) => {
          if (cancelled) return;
          setHits(h);
          setActive(0);
          setError(null);
        })
        .catch(() => !cancelled && setError("Catalogue unavailable — try again."));
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const visible = query.trim().replace(/[^a-z0-9]/gi, "").length >= 2 ? hits : [];

  function pick(hit: SearchHit) {
    onSelect(hit);
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        className="field-input placeholder:text-ink/40"
        value={query}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open && visible.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!visible.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, visible.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(visible[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      {open && visible.length > 0 ? (
        <ul id={listId} role="listbox" className="app-surface absolute z-30 mt-2 max-h-80 w-full overflow-auto p-1 text-sm">
          {visible.map((h, i) => (
            <li
              key={`${h.kind}-${h.gid}-${h.productId ?? h.label}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(h);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2 ${i === active ? "bg-canvas" : ""}`}
            >
              <span className="truncate font-bold">{h.label}</span>
              <span className="shrink-0 rounded-full border border-ink/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink/60">
                {h.kind === "brand" ? "Brand" : "Salt"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
