import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getOrCreateBook } from "@/lib/book";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploads";

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (kind !== "cover" && kind !== "pdf") {
    return NextResponse.json({ error: "kind must be cover or pdf" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const book = await getOrCreateBook();
  const saved = await saveUploadedFile(file, { prefix: kind });

  const updated = await prisma.book.update({
    where: { id: book.id },
    data: kind === "cover" ? { coverPath: saved.publicPath } : { pdfPath: saved.publicPath },
  });

  return NextResponse.json({ book: updated, uploaded: saved });
}

