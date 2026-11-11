"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <section className="login-card">
        <div className="login-logo">P</div>

        <div className="login-heading">
          <span className="login-eyebrow">YOUR PERSONAL SPACE</span>
          <h1>Welcome back.</h1>
          <p>
            Sign in to continue building better habits,
            one day at a time.
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in securely"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div className="login-footer">
          <span className="login-status-dot" />
          Private access · Your personal dashboard
        </div>
      </section>

      <p className="login-copyright">
        PHT-APP · PERSONAL HABIT TRACKER
      </p>
    </main>
  );
}
