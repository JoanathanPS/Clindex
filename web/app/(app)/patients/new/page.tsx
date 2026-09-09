import type { Metadata } from "next";
import { PatientForm } from "@/components/patient-form";

export const metadata: Metadata = {
  title: "New patient",
};

export default function NewPatientPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="console-label">Profile intake</p>
        <h1 className="mt-1 text-2xl font-black">New patient</h1>
        <p className="mt-1 text-sm text-ink/60">
          The interview will fill in the rest later — add what you know now.
        </p>
      </div>
      <div className="app-surface p-6 sm:p-7">
        <PatientForm />
      </div>
    </div>
  );
}
