import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  const dl = await prisma.downloadToken.findUnique({
    where: { token },
    include: { order: true },
  });

  if (!dl) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (dl.usedAt) return NextResponse.json({ error: "Link already used" }, { status: 410 });
  if (dl.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Link expired" }, { status: 410 });
  if (dl.order.status !== "PAID") return NextResponse.json({ error: "Order not paid" }, { status: 403 });

  const book = await prisma.book.findFirst();
  if (!book?.pdfPath) return NextResponse.json({ error: "PDF not configured" }, { status: 500 });

  const relativePdfPath = book.pdfPath.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePdfPath);
  const file = await readFile(absolutePath);

  await prisma.downloadToken.update({
    where: { id: dl.id },
    data: { usedAt: new Date() },
  });

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(book.title ?? "ebook").replaceAll('"', "")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

