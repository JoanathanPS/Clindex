"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

type Mode = "sign-in" | "sign-up";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [pendingOtp, setPendingOtp] = useState(false);
  const [pendingPassword, setPendingPassword] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);

  const isBusy = pendingOAuth || pendingOtp || pendingPassword;

  // Sync any URL auth errors (e.g. redirected from /auth/callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "auth-code-error") {
      setError("Sign-in verification failed or link expired. Please try again.");
    } else if (urlError) {
      setError(`Authentication error: ${urlError}`);
    }
  }, [searchParams]);

  // 1. Google OAuth sign-in
  async function handleGoogleSignIn() {
    setError(null);
    setPendingOAuth(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setPendingOAuth(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Google");
      setPendingOAuth(false);
    }
  }

  // 2. Email Magic Link (OTP) sign-in via Resend SMTP
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setPendingOtp(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setOtpSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setPendingOtp(false);
    }
  }

  // 3. Fallback password sign-in / sign-up
  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPendingPassword(true);

    try {
      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setError(result.error.message);
        setPendingPassword(false);
        return;
      }

      router.push("/patients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error");
      setPendingPassword(false);
    }
  }

  return (
    <div className="space-y-4 text-ink">
      {/* Continue with Google */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleGoogleSignIn}
        disabled={isBusy}
        className="w-full flex items-center justify-center gap-2 border-ink/30 hover:border-ink hover:bg-card text-ink font-medium"
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span>{pendingOAuth ? "Connecting to Google…" : "Continue with Google"}</span>
      </Button>

      {/* Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-ink/15" />
        <span className="mx-3 text-[11px] uppercase tracking-wider text-ink/40">
          or magic link
        </span>
        <div className="flex-grow border-t border-ink/15" />
      </div>

      {/* Magic Link Section */}
      {otpSuccess ? (
        <div className="rounded border border-success/30 bg-success/5 p-4 text-xs space-y-2">
          <p className="font-semibold text-success">Magic link sent!</p>
          <p className="text-ink/80 leading-relaxed">
            We sent a secure sign-in link to <strong className="font-mono">{email}</strong>.
            Click the link in the email to authenticate immediately.
          </p>
          <button
            type="button"
            onClick={() => setOtpSuccess(false)}
            className="text-xs text-ink/60 underline underline-offset-4 hover:text-accent"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <Field label="Email address" hint="We will email you a passwordless sign-in link">
            <TextInput
              type="email"
              required
              autoComplete="email"
              placeholder="clinician@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isBusy}
            />
          </Field>
          <Button
            type="submit"
            className="w-full"
            disabled={isBusy || !email}
          >
            {pendingOtp ? "Sending magic link…" : "Send magic link"}
          </Button>
        </form>
      )}

      {/* Error display */}
      {error && (
        <p className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger font-mono">
          {error}
        </p>
      )}



      {/* Expandable Password Sign-In & Sign-Up */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowPasswordAuth((v) => !v)}
          className="w-full text-center text-xs text-ink/50 underline underline-offset-4 hover:text-ink/80 transition-colors"
        >
          {showPasswordAuth
            ? "▲ Hide password sign-in"
            : "▼ Sign in with password / Create account"}
        </button>

        {showPasswordAuth && (
          <form onSubmit={handlePasswordAuth} className="mt-3 space-y-3 rounded border border-ink/15 bg-card/20 p-3">
            <Field label="Password">
              <TextInput
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBusy}
              />
            </Field>

            <Button
              type="submit"
              variant="ghost"
              className="w-full border-ink/30 hover:bg-card"
              disabled={isBusy || !email || !password}
            >
              {pendingPassword
                ? "Working…"
                : mode === "sign-in"
                  ? "Sign in with password"
                  : "Create account"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setError(null);
              }}
              className="w-full text-center text-[11px] text-ink/60 underline underline-offset-4 hover:text-accent"
            >
              {mode === "sign-in"
                ? "Need an account? Register"
                : "Already registered? Sign in with password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}