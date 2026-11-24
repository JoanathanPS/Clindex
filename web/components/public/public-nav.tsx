import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/find", label: "Find" },
  { href: "/ask", label: "Ask" },
  { href: "/rx", label: "Rx" },
  { href: "/care", label: "Care" },
];

export function PublicNav() {
  return (
    <header className="relative z-10 border-b-2 border-ink bg-card">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-85" aria-label="ClinDex home">
          <Image src="/clindex-logo.png" alt="ClinDex" width={88} height={36} priority className="h-7 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-4 text-xs font-black uppercase tracking-[.12em]" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="device-button device-button-light hidden sm:inline-flex">
            Clinician
          </Link>
        </nav>
      </div>
    </header>
  );
}
