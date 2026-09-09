import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <div className="page-grid" aria-hidden="true" />
      <Shell email={profile?.email ?? user.email ?? "user"} role={profile?.role} />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="relative z-10 border-t-2 border-ink bg-card py-4 text-center text-[10px] font-bold uppercase tracking-[.1em] text-ink/55">
        Research/educational capstone — not a certified medical device
      </footer>
    </div>
  );
}
