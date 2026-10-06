"use client";
import Link from "next/link";
import { ArrowUpLeft, ArrowRight, ArrowLeft, LogOut, Check, LoaderCircle } from "lucide-react";
import type { MemberData } from "@/lib/types";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";
export function Ornaments() { return <div className="ornaments" aria-hidden="true"><div className="green-ribbon"><i /></div><div className="cyan-bend" /><div className="orange-disc" /><div className="coral-rules"><i /><i /></div></div>; }
export function Header({ active = "", groupName, members = [], name, status, navigate }: {
  active?: string; groupName?: string; members?: MemberData[]; name?: string; status?: string; navigate?: (url: string) => void
}) {
  function link(url: string, e: React.MouseEvent) { if (navigate) { e.preventDefault(); navigate(url); } }
  return <header className="site-header">
    <Link className="brand" href="/" onClick={e => link("/", e)} aria-label="INT6066 course home"><ArrowUpLeft size={38} strokeWidth={4} /><span>INT6066</span></Link>
    <nav aria-label="Main navigation"><Link className={active === "home" ? "active" : ""} href="/" onClick={e => link("/", e)}>Course Home</Link><Link className={active === "project" ? "active" : ""} href="/project/observation" onClick={e => link("/project/observation", e)}>Group Project</Link><Link className={active === "reflection" ? "active" : ""} href="/reflection" onClick={e => link("/reflection", e)}>My Reflection</Link></nav>
    {groupName ? <div className="identity"><div><strong>{groupName}</strong><small>{name}</small></div><div className="avatars" role="group" aria-label={groupName === "Test" ? `${members.length} practice users` : `${members.length} of 6 members`}>{members.slice(0, 6).map(m => <span key={m.id} title={m.name}>{m.name.slice(0, 1).toUpperCase()}</span>)}{members.length > 6 ? <span title={`${members.length} practice users`}>+{members.length - 6}</span> : null}</div>{status ? <span className={`save-status ${status.includes("saved") || status === "Saved" ? "saved" : ""}`} role="status">{status === "Saving…" ? <LoaderCircle size={14} className="spin" /> : status === "Saved" ? <Check size={14} /> : null}{status}</span> : null}</div> : <Link href="/join" className="btn small">Join your group <ArrowRight size={16} /></Link>}
  </header>;
}
export function Button({ children, secondary = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) { return <button {...props} className={`btn ${secondary ? "secondary" : ""} ${props.className ?? ""}`}>{children}</button>; }
export function Field({ label, hint, children, required, conditional = false }: { label: string; hint?: string; children: ReactNode; required?: boolean; conditional?: boolean }) {
  const hintId = useId();
  const control = isValidElement<{ required?: boolean; "aria-describedby"?: string }>(children) ? children : null;
  const needed = required ?? control?.props.required ?? false;
  const input = control ? cloneElement(control, { required: needed, ...(hint ? { "aria-describedby": hintId } : {}) }) : children;
  return <div className={`field ${needed ? "required-field" : ""}`}><label><span className="field-label">{label}<span className={`field-requirement ${needed ? "required" : ""}`}>{conditional ? "Required if added" : needed ? "Required" : "Optional"}</span></span>{input}</label>{hint ? <small id={hintId}>{hint}</small> : null}</div>;
}
export function Panel({ title, eyebrow, children, className = "" }: { title?: string; eyebrow?: string; children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}{title ? <h2>{title}</h2> : null}{children}</section>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty"><span className="empty-mark" aria-hidden="true">↗</span><strong>{title}</strong>{children ? <p>{children}</p> : null}</div>; }
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) { return <div className={`notice ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{children}</div>; }
export function SignOut({ navigate }: { navigate?: (url: string) => void }) { async function leave() { await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); window.location.href = "/join"; } return <button className="text-btn" onClick={() => { if (navigate) navigate("/join"); else void leave(); }}><LogOut size={15} /> Switch identity</button>; }
export function BackLink() { return <Link className="back-link" href="/"><ArrowLeft size={16} /> Back to course</Link>; }
