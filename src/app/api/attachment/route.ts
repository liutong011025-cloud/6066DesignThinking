import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { db } from "@/lib/db";
import { sameOrigin } from "@/lib/origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const s = await session();
  if (!s?.memberId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    if (Number(req.headers.get("content-length") ?? 0) > 2200000) return NextResponse.json({ error: "Please use a file smaller than 2 MB." }, { status: 413 });
    const form = await req.formData();
    const id = String(form.get("observationId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2000000 || !allowed.includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP or PDF under 2 MB." }, { status: 400 });
    if (!await db().observation.findFirst({ where: { id, memberId: s.memberId, groupId: s.groupId } })) return NextResponse.json({ error: "You can attach evidence to your own records only." }, { status: 403 });
    const data = { filename: file.name.slice(0, 150).replace(/[\r\n]/g, ""), mime: file.type, bytes: new Uint8Array(await file.arrayBuffer()), size: file.size };
    await db().attachment.upsert({ where: { observationId: id }, create: { observationId: id, ...data }, update: data });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "The file could not be saved. Please try again." }, { status: 503 }); }
}
export async function GET(req: NextRequest) {
  const s = await session();
  if (!s) return new NextResponse("Please sign in.", { status: 401 });
  const item = await db().attachment.findUnique({ where: { id: req.nextUrl.searchParams.get("id") ?? "" }, include: { observation: { select: { groupId: true } } } });
  if (!item || (s.role !== "teacher" && item.observation.groupId !== s.groupId)) return new NextResponse("Not found.", { status: 404 });
  return new NextResponse(item.bytes, { headers: {
    "Content-Type": item.mime, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"
  } });
}
