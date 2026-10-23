"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ClipboardList, Dumbbell, Home, LogOut, TrendingUp, Utensils } from "lucide-react";
import type { Data, PostFn, Tab, ToastFn } from "@/lib/types";
import Today from "./today";
import Food from "./food";
import Workout from "./workout";
import Progress from "./progress";
import Plan from "./plan";
import RestBar, { type Rest } from "./rest-bar";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "today", label: "Today", icon: Home },
  { id: "food", label: "Food", icon: Utensils },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "plan", label: "Plan", icon: ClipboardList },
];
const isTab = (v: string): v is Tab => TABS.some((t) => t.id === v);
type Toast = { id: number; message: string; action?: { label: string; run: () => void } };

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [rest, setRest] = useState<Rest | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const showToast: ToastFn = useCallback((message, action) => setToast({ id: Date.now(), message, action }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.action ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tracker", { cache: "no-store" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error("load failed");
      setData((await res.json()) as Data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Load once, and again whenever the app comes back to the foreground (new day, other device).
  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  // Tabs live in the URL hash, so the phone's back button moves between tabs.
  useEffect(() => {
    const sync = () => { const h = window.location.hash.slice(1); setTab(isTab(h) ? h : "today"); };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);
  const go = useCallback((next: Tab) => {
    setTab(next);
    const target = next === "today" ? window.location.pathname : `#${next}`;
    if ((window.location.hash || "") !== (next === "today" ? "" : `#${next}`)) history.pushState(null, "", target);
    window.scrollTo({ top: 0 });
  }, []);

  const post: PostFn = useCallback(async (body) => {
    try {
      const res = await fetch("/api/tracker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = "/login"; return null; }
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Couldn’t save. Please try again.");
      await refresh();
      return json;
    } catch (e) {
      showToast(e instanceof TypeError ? "No connection — nothing was saved." : e instanceof Error ? e.message : "Couldn’t save.");
      return null;
    }
  }, [refresh, showToast]);

  const patch = useCallback((fn: (d: Data) => Data) => setData((d) => (d ? fn(d) : d)), []);

  const startRest = useCallback((seconds: number) => {
    try {
      if (!audio.current) {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) audio.current = new Ctx();
      }
      void audio.current?.resume();
    } catch {
      /* sound is optional */
    }
    setRest({ endAt: Date.now() + seconds * 1000, total: seconds });
  }, []);
  const closeRest = useCallback(() => setRest(null), []);
  const addRest = useCallback((s: number) => setRest((r) => (r ? { endAt: Math.max(r.endAt, Date.now()) + s * 1000, total: r.total + s } : r)), []);

  async function signOut() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar-in">
          <button className="brand" onClick={() => go("today")} aria-label="forma home">
            <span className="logo"><Activity size={18} strokeWidth={2.5} /></span>
            <b>forma<i>.</i></b>
          </button>
          <nav className="topnav" aria-label="Sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}><Icon size={17} />{label}</button>
            ))}
          </nav>
          {data?.locked && <button className="icon-btn" onClick={() => void signOut()} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>}
        </div>
      </header>

      <main className="page">
        {!data ? (
          failed ? (
            <div className="loading"><p>Couldn’t load your data.</p><button className="btn dark sm" onClick={() => void refresh()}>Try again</button></div>
          ) : (
            <div className="loading"><div className="spinner" />Loading…</div>
          )
        ) : (
          <>
            {tab === "today" && <Today data={data} post={post} patch={patch} toast={showToast} go={go} />}
            {tab === "food" && <Food data={data} post={post} toast={showToast} />}
            {tab === "workout" && <Workout data={data} post={post} toast={showToast} startRest={startRest} />}
            {tab === "progress" && <Progress data={data} post={post} toast={showToast} />}
            {tab === "plan" && <Plan go={go} />}
          </>
        )}
      </main>

      <nav className="tabbar no-print" aria-label="Sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => go(id)} aria-current={tab === id ? "page" : undefined}>
            <Icon size={21} strokeWidth={tab === id ? 2.4 : 2} />
            {label}
          </button>
        ))}
      </nav>

      {rest && <RestBar key={rest.endAt} rest={rest} audio={audio.current} onClose={closeRest} onAdd={addRest} />}
      {toast && (
        <div key={toast.id} className={`toast no-print ${rest ? "lifted" : ""}`} role="status">
          <span>{toast.message}</span>
          {toast.action && <button onClick={() => { toast.action?.run(); setToast(null); }}>{toast.action.label}</button>}
        </div>
      )}
    </div>
  );
}
