import { Suspense } from "react";
import type { Metadata } from "next";
import { FindApp } from "@/components/public/find-app";

export const metadata: Metadata = {
  title: "Find",
  description: "Check a prescription for interactions and find the cheapest same-salt basket.",
};

export default function FindPage() {
  return (
    <Suspense>
      <FindApp />
    </Suspense>
  );
}
