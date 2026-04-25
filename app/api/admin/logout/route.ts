import { NextResponse } from "next/server";
import { clearAdminAuthed } from "@/lib/adminAuth";

export async function POST() {
  await clearAdminAuthed();
  return NextResponse.json({ ok: true });
}

