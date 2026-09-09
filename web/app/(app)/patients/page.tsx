import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Patient } from "@/lib/types";

export const metadata: Metadata = {
  title: "Patients",
};

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="console-label">Patient archive</p>
          <h1 className="mt-1 text-2xl font-black">Records</h1>
          <p className="mt-1 text-sm text-ink/60">
            {patients?.length ?? 0} patient(s) on file
          </p>
        </div>
        <Link
          href="/patients/new"
          className="device-button"
        >
          New patient
        </Link>
      </div>

      {patients && patients.length > 0 ? (
        <ul className="app-surface overflow-hidden divide-y-2 divide-ink/15">
          {patients.map((p: Patient) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 text-sm transition-colors hover:bg-[#e9e2d3]"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-ink/50">
                  {p.age != null ? `${p.age} yrs · ` : ""}
                  {p.gender ?? "—"} · added {formatDate(p.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="app-surface border-dashed px-6 py-16 text-center text-sm text-ink/60">
          No patients yet. Create one to start a prescription.
        </div>
      )}
    </div>
  );
}
