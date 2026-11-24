import { PublicNav } from "@/components/public/public-nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-canvas">
      <div className="page-grid" aria-hidden="true" />
      <PublicNav />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="relative z-10 border-t-2 border-ink bg-card px-4 py-4 text-center text-[10px] font-bold uppercase leading-5 tracking-[.1em] text-ink/55">
        Information and decision support only — not a certified medical device and not medical advice. In an emergency call 112.
      </footer>
    </div>
  );
}
