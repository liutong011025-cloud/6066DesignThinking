"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_DRAFT, type Draft, type ProjectData } from "@/lib/types";
import { STEPS } from "@/lib/course";
export async function api(action: string, fields: object = {}) {
  const r = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...fields }) });
  const data = await r.json();
  if (!r.ok) { const error = new Error(data.error ?? "Please try again.") as Error & { conflict?: boolean; details?: string[] }; error.conflict = data.conflict; error.details = data.details; throw error; }
  return data;
}
interface ProjectContextValue {
  data: ProjectData; draft: Draft; status: string; error: string; setError: (s: string) => void;
  patch: (values: Partial<Draft>) => void; refresh: () => Promise<void>; flush: () => Promise<boolean>;
  navigate: (path: string) => Promise<void>; revision: () => number;
}
const Context = createContext<ProjectContextValue | null>(null);
const FIELD_LABELS: Record<string, string> = { targetUsers: "Target learners", learningContext: "Learning situation", emergingFocus: "Emerging focus", selectedEvidenceIds: "Selected evidence", interpretations: "Interpretations", unknowns: "Open questions", patterns: "Patterns", candidates: "Possible problems", selectedCandidateId: "Chosen problem", who: "Learners", situation: "Situation", need: "Learning need", difficulty: "Difficulty", statement: "Problem statement", hmw: "How might we question", feedbackRequest: "Feedback request", nextInquiry: "Next inquiry", learningGoal: "Learning goal" };
function describeField(key: string, value: unknown, project: ProjectData): string {
  if (key === "selectedCandidateId") return project.group.draft.candidates?.find(c => c.id === value)?.title || "Not chosen yet";
  if (Array.isArray(value)) return value.map(item => {
    if (typeof item === "string") { const note = project.group.observations.find(n => n.id === item); return note ? `${note.member.name}: ${note.body}` : "Evidence no longer available"; }
    if (item && typeof item === "object") return [item.text || item.title || item.question, item.method ? `How to check: ${item.method}` : "", item.alternative ? `Alternative: ${item.alternative}` : ""].filter(Boolean).join("\n");
    return "";
  }).filter(Boolean).join("\n\n") || "None yet";
  return typeof value === "string" && value.trim() ? value : "Not recorded yet";
}
export function useProject() { const value = useContext(Context); if (!value) throw new Error("Project context is missing"); return value; }
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProjectData | null>(null); const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState("Loading…"); const [error, setError] = useState(""); const [conflict, setConflict] = useState<ProjectData | null>(null);
  const [tick, setTick] = useState(0); const [loadingError, setLoadingError] = useState("");
  const router = useRouter(); const rev = useRef(0); const pending = useRef<Partial<Draft>>({}); const saving = useRef<Promise<boolean> | null>(null);
  const inFlight = useRef<Partial<Draft>>({});
  const failed = useRef(false); const storageKey = useRef(""); const conflictRef = useRef(false);
  const latestRead = useRef(0);
  const persist = useCallback(() => { if (storageKey.current) { const backup = { ...inFlight.current, ...pending.current }; try { if (Object.keys(backup).length) sessionStorage.setItem(storageKey.current, JSON.stringify({ revision: rev.current, patch: backup })); else sessionStorage.removeItem(storageKey.current); } catch { /* Storage is optional; database saving remains available. */ } } }, []);
  const refresh = useCallback(async () => {
    const read = ++latestRead.current;
    const r = await fetch("/api/studio", { cache: "no-store" }); const value = await r.json();
    if (r.status === 401) { router.replace("/join"); return; }
    if (!r.ok) throw new Error(value.error);
    if (value.session.role === "teacher") { router.replace("/teacher"); return; }
    if (read !== latestRead.current || value.group.revision < rev.current) return;
    setData(value);
    if (!Object.keys(pending.current).length && !saving.current && !conflictRef.current) { rev.current = value.group.revision; setDraft({ ...EMPTY_DRAFT, ...value.group.draft }); }
  }, [router]);
  useEffect(() => {
    let disposed = false;
    async function initial() {
      try {
        const r = await fetch("/api/studio", { cache: "no-store" }); const value = await r.json();
        if (r.status === 401) { router.replace("/join"); return; } if (!r.ok) throw new Error(value.error);
        if (value.session.role === "teacher") { router.replace("/teacher"); return; } if (disposed) return;
        setData(value); rev.current = value.group.revision; storageKey.current = `int6066-draft-v1:${value.session.memberId}`;
        let restored: Partial<Draft> = {};
        try { const raw = sessionStorage.getItem(storageKey.current); if (raw) { const stored = JSON.parse(raw); restored = stored.patch; rev.current = stored.revision; pending.current = restored; } } catch { /* Ignore an invalid browser backup. */ }
        setDraft({ ...EMPTY_DRAFT, ...value.group.draft, ...restored }); setStatus(Object.keys(restored).length ? "Unsaved changes" : "Saved"); if (Object.keys(restored).length) setTick(n => n + 1);
      } catch (e) { if (!disposed) setLoadingError(e instanceof Error ? e.message : "Unable to connect."); }
    }
    void initial(); return () => { disposed = true; };
  }, [router]);
  const flush = useCallback(async (): Promise<boolean> => {
    if (conflictRef.current) return false;
    while (saving.current) { if (!await saving.current) return false; }
    if (!Object.keys(pending.current).length) return true;
    const values = pending.current; pending.current = {}; inFlight.current = values; persist(); setStatus("Saving…"); failed.current = false;
    const task = (async () => {
      try { const result = await api("draft", { patch: values, revision: rev.current }); rev.current = result.revision; setStatus(Object.keys(pending.current).length ? "Unsaved changes" : "Saved"); setError(""); persist(); return true; }
      catch (e) {
        pending.current = { ...values, ...pending.current }; failed.current = true; persist(); setStatus("Not saved"); setError(e instanceof Error ? e.message : "Could not save. Please try again.");
        if ((e as { conflict?: boolean }).conflict) { try { const r = await fetch("/api/studio"); if (r.ok) { conflictRef.current = true; setConflict(await r.json()); } } catch { /* Keep retry available if the latest version could not be loaded. */ } }
        return false;
      } finally { saving.current = null; inFlight.current = {}; persist(); }
    })();
    saving.current = task; const ok = await task;
    if (ok && Object.keys(pending.current).length) return flush();
    return ok;
  }, [persist]);
  const patch = useCallback((values: Partial<Draft>) => { pending.current = { ...pending.current, ...values }; setDraft(d => ({ ...d, ...values })); persist(); setStatus("Unsaved changes"); failed.current = false; setTick(n => n + 1); }, [persist]);
  useEffect(() => { if (!tick) return; const timeout = setTimeout(() => { if (!failed.current) void flush(); }, 850); return () => clearTimeout(timeout); }, [tick, flush]);
  useEffect(() => {
    const interval = setInterval(() => { if (!Object.keys(pending.current).length && !saving.current && !conflictRef.current && !document.hidden) void refresh().catch(() => setStatus("Offline · retrying")); }, 12000);
    const unload = (e: BeforeUnloadEvent) => { if (Object.keys(pending.current).length || saving.current) { e.preventDefault(); } };
    window.addEventListener("beforeunload", unload); return () => { clearInterval(interval); window.removeEventListener("beforeunload", unload); };
  }, [refresh]);
  useEffect(() => {
    if (!conflict) return;
    const dialog = document.querySelector<HTMLElement>("[data-conflict-dialog]");
    const previous = document.activeElement as HTMLElement | null;
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!dialog?.contains(document.activeElement) || (!e.shiftKey && document.activeElement === last)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); previous?.focus(); };
  }, [conflict]);
  async function navigate(path: string) {
    if (!await flush()) return;
    const step = STEPS.find(s => path === `/project/${s.key}`);
    if (step) {
      try { await api("checkStep", { step: step.key }); }
      catch (e) { const issue = e as Error & { details?: string[] }; setError([issue.message, ...(issue.details ?? [])].join(" ")); return; }
    }
    setError(""); router.push(path);
  }
  async function resolveConflict(keepMine: boolean) {
    if (!conflict) return;
    const merged = keepMine ? { ...EMPTY_DRAFT, ...conflict.group.draft, ...pending.current } : { ...EMPTY_DRAFT, ...conflict.group.draft };
    rev.current = conflict.group.revision; setData(conflict); setDraft(merged); if (!keepMine) pending.current = {};
    setConflict(null); conflictRef.current = false; failed.current = false; persist(); setError(""); setStatus(keepMine ? "Saving…" : "Saved"); if (keepMine) await flush();
  }
  if (!data) return <main id="main" className="loading-page"><div className="brand">↖ INT6066</div><h1>{loadingError ? "Let’s reconnect." : "Opening your workspace…"}</h1>{loadingError ? <><p role="alert">{loadingError}</p><button className="btn" onClick={() => window.location.reload()}>Try again</button><a className="btn secondary" href="/join">Back to sign in</a></> : <div className="loading-bar" />}</main>;
  return <Context.Provider value={{ data, draft, status, error, setError, patch, refresh, flush, navigate, revision: () => rev.current }}>
    {children}
    {conflict ? <div className="modal-backdrop"><section className="panel conflict-modal" data-conflict-dialog role="dialog" aria-modal="true" aria-labelledby="conflict-title" aria-describedby="conflict-description"><p className="eyebrow">SHARED WORKSPACE UPDATE</p><h2 id="conflict-title">A teammate saved a new version.</h2><p id="conflict-description">Your changes are still here. Review the fields below, then choose how to continue.</p><div className="conflict-fields">{Object.keys(pending.current).map(key => <div key={key}><strong>{FIELD_LABELS[key] || key}</strong><p>Group version: {describeField(key, conflict.group.draft[key as keyof Draft], conflict)}</p><p>Your version: {describeField(key, pending.current[key as keyof Draft], { ...conflict, group: { ...conflict.group, draft } })}</p></div>)}</div><div className="button-row"><button className="btn secondary" onClick={() => void resolveConflict(false)}>Use group version</button><button className="btn" onClick={() => void resolveConflict(true)}>Save my changed fields</button></div></section></div> : null}
  </Context.Provider>;
}
