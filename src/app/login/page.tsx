"use client";

import { useState } from "react";
import { Activity, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!res.ok) {
        const r = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(r.error || "Sign-in failed.");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <span className="logo"><Activity size={24} strokeWidth={2.5} /></span>
        <h1>forma<i>.</i></h1>
        <p className="muted small">Your private tracker. Enter your password to continue.</p>
        <label className="auth-field">
          <Lock size={16} />
          <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn lime block" disabled={loading || !password}>{loading ? "Signing in…" : "Sign in"}<ArrowRight size={16} /></button>
      </form>
    </main>
  );
}
