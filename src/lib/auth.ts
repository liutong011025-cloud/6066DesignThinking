import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";
export type Session = { role: "student" | "teacher"; name: string; memberId?: string; groupId?: number };
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32 || s.startsWith("REPLACE_")) throw new Error("A fresh SESSION_SECRET of at least 32 characters is required");
  return new TextEncoder().encode(s);
}
export async function setSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set("studio-session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
}
export async function session(): Promise<Session | null> {
  const token = (await cookies()).get("studio-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.role === "teacher") return { role: "teacher", name: "Nicole" };
    if (payload.role !== "student" || typeof payload.memberId !== "string") return null;
    const member = await db().member.findUnique({ where: { id: payload.memberId }, select: { id: true, name: true, groupId: true } });
    return member ? { role: "student", name: member.name, memberId: member.id, groupId: member.groupId } : null;
  } catch { return null; }
}
export async function clearSession() { (await cookies()).delete("studio-session"); }
export function teacherPasswordMatches(input: string) {
  const configured = process.env.TEACHER_PASSWORD;
  if (!configured) throw new Error("TEACHER_PASSWORD is missing");
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(input), hash(configured));
}
