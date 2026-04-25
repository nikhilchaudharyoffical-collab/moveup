import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { setAdminAuthed } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password) return NextResponse.json({ error: "Missing password" }, { status: 400 });

  if (body.password !== env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAdminAuthed();
  return NextResponse.json({ ok: true });
}

