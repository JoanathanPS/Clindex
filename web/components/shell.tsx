"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Shell({ email, role }: { email: string; role?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b-2 border-ink bg-card">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/patients"
          className="flex items-center hover:opacity-85 transition-opacity"
        >
          <Image
            src="/clindex-logo.png"
            alt="ClinDex"
            width={88}
            height={36}
            priority
            className="h-7 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-3 text-xs font-bold uppercase tracking-[.1em]">
          <Link href="/patients" className="hover:text-accent">
            Records
          </Link>
          {role === "researcher" || role === "admin" ? (
            <Link href="/eval" className="hover:text-accent">
              Evaluation
            </Link>
          ) : null}
          <span className="hidden max-w-40 truncate text-ink/50 md:inline">{email}</span>
          <button
            onClick={signOut}
            className="control-button border-2 bg-canvas px-3 py-1 text-xs hover:bg-[#e9e2d3]"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
