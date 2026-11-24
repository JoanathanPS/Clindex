import type { Metadata } from "next";
import { RxDemo } from "@/components/public/rx-demo";

export const metadata: Metadata = { title: "Rx", description: "Signed, verifiable e-prescriptions with a per-item dispense ledger." };

export default function RxPage() {
  return <RxDemo />;
}
