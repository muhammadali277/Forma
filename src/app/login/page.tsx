"use client";

import { useState } from "react";
import { Activity, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!res.ok) { const r = await res.json().catch(() => ({})); throw new Error(r.error || "Sign-in failed."); }
      window.location.href = "/";
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); setLoading(false); }
  }

  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="brand-mark login-mark"><Activity size={24} strokeWidth={2.5} /></div>
    <h1>forma<span>.</span></h1>
    <p>Your private recomposition tracker. Enter your password to continue.</p>
    <label className="login-field"><Lock size={16} /><input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></label>
    {error && <div className="login-error">{error}</div>}
    <button className="primary-button full" disabled={loading || !password}>{loading ? "Signing in..." : "Sign in"}<ArrowRight size={16} /></button>
  </form></main>;
}
