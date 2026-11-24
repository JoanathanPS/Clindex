import type { Metadata } from "next";
import { AskApp } from "@/components/public/ask-app";

export const metadata: Metadata = { title: "Ask", description: "Understand a medicine and check warning signs before self-care." };

export default function AskPage() {
  return <AskApp />;
}
