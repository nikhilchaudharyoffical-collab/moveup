import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

