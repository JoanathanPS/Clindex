import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://rfemgzedvjpwaeivfjhn.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZW1nemVkdmpwd2FlaXZmamhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTcxMTksImV4cCI6MjEwMjc3MzExOX0.118Vp8mAFb6T7vVvTGhE2A87yRxXvTG00ocNLFM6ACQ";

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, key);
}