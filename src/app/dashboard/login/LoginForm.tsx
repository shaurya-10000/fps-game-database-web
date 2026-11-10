"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, isTokenValid, login, register } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "register";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const existing = getToken();
    if (existing && isTokenValid(existing)) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (username.length < 2) throw new Error("Username must be at least 2 characters.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await register(email, username, password);
      }
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      if (message === "INVALID_CREDENTIALS") setError("Invalid email or password.");
      else if (message === "EMAIL_IN_USE") setError("This email is already registered.");
      else if (message === "USERNAME_TAKEN") setError("This username is already taken.");
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-20 sm:px-0">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent/10">
          <span className="text-2xl">🎮</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
          {mode === "login" ? "Welcome back" : "Join the arena"}
        </h1>
        <p className="mt-2 text-[13px] text-muted">
          {mode === "login" 
            ? "Sign in to access your dashboard, friends, and stats." 
            : "Create an account to track your stats, add friends, and chat."}
        </p>
      </div>

      <div className="mb-8 flex rounded-lg border border-border bg-surface p-1">
        <button
          onClick={() => { setMode("login"); setError(null); }}
          className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
            mode === "login" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode("register"); setError(null); }}
          className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
            mode === "register" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted/60 focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="player@example.com"
          />
        </label>

        <AnimatePresence mode="popLayout">
          {mode === "register" && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="block overflow-hidden"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Username</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={32}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted/60 focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="ShadowStrike"
              />
            </motion.label>
          )}
        </AnimatePresence>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted/60 focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-foreground px-4 py-2.5 text-[14px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border"></div>
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">or continue with</span>
        <div className="h-px flex-1 bg-border"></div>
      </div>

      <button
        type="button"
        onClick={() => alert("Google OAuth will be configured in production.")}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
      >
        <svg className="size-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="text-[12px] text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
