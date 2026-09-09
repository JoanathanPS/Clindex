import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-canvas px-4 py-16">
      <div className="page-grid" aria-hidden="true" />
      <div className="w-full max-w-sm">
        <div className="relative z-10 mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <Image
              src="/clindex-logo.png"
              alt="ClinDex"
              width={180}
              height={73}
              priority
              className="h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <p className="mt-3 text-xs text-ink/60">
            AI-assisted drug interaction check
          </p>
        </div>
        <div className="relative z-10 app-surface p-6">
          <Suspense fallback={<div className="py-4 text-center text-xs text-ink/50">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="relative z-10 mt-6 text-center text-xs leading-relaxed text-ink/50">
          Research/educational capstone — not a certified medical device.
          <br />
          Output is decision support only.
        </p>
      </div>
    </div>
  );
}
