"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Users, LockKeyhole } from "lucide-react";
import { GROUP_NAMES } from "@/lib/course";
import { Header, Ornaments, Panel, Field, Button, Notice, BackLink } from "@/components/ui";
export default function Join() {
  const [group, setGroup] = useState(""); const [name, setName] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", group, name, password }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); router.push(data.destination); }
    catch (e) { setError(e instanceof Error ? e.message : "We could not connect. Please try again."); } finally { setBusy(false); }
  }
  const teacher = group === "Nicole"; const practice = group === "23";
  return <div className="page"><Ornaments /><Header /><main id="main" className="join-main"><div className="join-copy"><p className="eyebrow">YOUR SIX PERSPECTIVES START HERE</p><h1>Think together.<br />Start with<br /><span className="green-text">your group.</span></h1><p className="subtitle">Choose your group. Introduce yourself.<br />Make your thinking part of the journey.</p><div className="join-path"><span>01 Empathize</span><ArrowRight /><span>02 Define</span></div><BackLink /></div>
    <Panel title={teacher ? "Welcome, Nicole." : "Join your group"} className="join-panel"><div className="round-symbol">{teacher ? <LockKeyhole size={30} /> : <Users size={30} />}</div><p className="muted">{teacher ? "Sign in to follow every group’s progress and guide their next step." : "Your name and work will be saved in your group’s workspace."}</p><form onSubmit={submit}><Field label="Your group"><select required value={group} onChange={e => { setGroup(e.target.value); setError(""); }}><option value="">Select your group</option>{GROUP_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}<option value="Nicole">Nicole · Teacher</option></select></Field>
      {teacher ? <Field label="Teacher password"><input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></Field> : <Field label="Your name" hint="Returning? Select the same group and use the same name."><input autoComplete="name" required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" /></Field>}
      {practice ? <Notice>Test is a practice workspace. Trial users and work are excluded from course progress.</Notice> : null}{error ? <Notice error>{error}</Notice> : null}<Button type="submit" disabled={busy || !group}>{busy ? "Opening your workspace…" : teacher ? "Enter teacher workspace" : "Join & start Empathize"}<ArrowRight size={19} /></Button>
    </form><p className="join-foot">22 course groups · 6 members each · Separate Test workspace</p></Panel></main></div>;
}
