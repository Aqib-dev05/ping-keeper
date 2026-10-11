"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type MonitorView = {
  id: string;
  name: string;
  url: string;
  intervalMin: number;
  active: boolean;
  lastOk: boolean | null;
  lastStatus: number | null;
  lastResponseMs: number | null;
  lastCheckedAt: string | null;
  history: boolean[];
};

function ago(iso: string | null) {
  if (!iso) return "not checked yet";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

const SNIPPETS = `// Node / Express
app.get("/health", (req, res) => res.send("ok"));

# Python / FastAPI
@app.get("/health")
def health(): return {"status": "ok"}

# Python / Flask
@app.route("/health")
def health(): return "ok"

<?php // PHP: health.php
echo "ok";

// Java / Spring Boot
@GetMapping("/health")
public String health() { return "ok"; }

// Go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })`;

export default function Dashboard({
  email, monitors, max, intervals,
}: { email: string; monitors: MonitorView[]; max: number; intervals: number[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    const fd = new FormData(form);
    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), url: fd.get("url"), intervalMin: Number(fd.get("intervalMin")) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not add this URL");
    form.reset();
    router.refresh();
  }

  async function toggle(m: MonitorView) {
    await fetch(`/api/monitors/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
    router.refresh();
  }

  async function remove(m: MonitorView) {
    if (!confirm(`Delete "${m.name}"?`)) return;
    await fetch(`/api/monitors/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const full = monitors.length >= max;

  return (
    <div className="wrap">
      <nav className="nav">
        <Link href="/" className="logo">Ping<i>Keeper</i></Link>
        <div className="who">
          <span>{email}</span>
          <button className="btn ghost small" onClick={logout}>Log out</button>
        </div>
      </nav>

      <div className="dash-head">
        <h1>Your URLs</h1>
        <span className="sub" style={{ margin: 0 }}>{monitors.length} of {max} used</span>
      </div>

      <section className="panel">
        <h2>Add a URL</h2>
        <p className="sub">Use a lightweight endpoint such as /health. Every 10 minutes works for Render.</p>
        <form className="addgrid" onSubmit={add}>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" placeholder="My API" maxLength={60} required disabled={full} />
          </div>
          <div>
            <label htmlFor="url">URL</label>
            <input id="url" name="url" type="url" placeholder="https://my-api.onrender.com/health" required disabled={full} />
          </div>
          <div>
            <label htmlFor="intervalMin">Every</label>
            <select id="intervalMin" name="intervalMin" defaultValue={10} disabled={full}>
              {intervals.map((i) => <option key={i} value={i}>{i} min</option>)}
            </select>
          </div>
          <button className="btn" disabled={busy || full}>{busy ? "Adding" : "Add URL"}</button>
        </form>
        {full && <p className="err">You have reached the limit of {max} URLs. Delete one to add another.</p>}
        {error && <p className="err" role="alert">{error}</p>}
        <details>
          <summary>Need a health endpoint for your backend?</summary>
          <pre>{SNIPPETS}</pre>
        </details>
      </section>

      <section className="panel">
        {monitors.length === 0 && <p className="empty">Nothing here yet. Add your first URL above.</p>}
        {monitors.map((m) => {
          const state = !m.active ? "paused" : m.lastOk === null ? "" : m.lastOk ? "up" : "down";
          const up = m.history.filter(Boolean).length;
          return (
            <div className="row" key={m.id}>
              <span className={`dot ${state}`} title={state || "waiting for first check"} />
              <div>
                <div className="name">{m.name}</div>
                <div className="url">{m.url}</div>
                <div className="meta" suppressHydrationWarning>
                  {!m.active ? "Paused" : `Every ${m.intervalMin} min`}
                  {m.lastCheckedAt && <> · {m.lastStatus ?? "no response"} in {m.lastResponseMs} ms · {ago(m.lastCheckedAt)}</>}
                  {m.history.length > 0 && <> · {Math.round((up / m.history.length) * 100)}% up</>}
                </div>
                {m.history.length > 0 && (
                  <div className="bars" aria-hidden="true">
                    {m.history.map((ok, i) => <b key={i} className={ok ? "" : "x"} />)}
                  </div>
                )}
              </div>
              <div className="ctl">
                <button className="btn ghost small" onClick={() => toggle(m)}>{m.active ? "Pause" : "Resume"}</button>
                <button className="btn danger small" onClick={() => remove(m)}>Delete</button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
