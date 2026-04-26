import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateBook } from "@/lib/book";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const book = await prisma.book.findFirst();
  return NextResponse.json({ book });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const book = await getOrCreateBook();
  const body = (await req.json().catch(() => null)) as
    | { title?: string; description?: string; author?: string; priceUsdt?: number }
    | null;

  const updated = await prisma.book.update({
    where: { id: book.id },
    data: {
      title: body?.title ?? book.title,
      description: body?.description ?? book.description,
      author: body?.author ?? book.author,
      priceUsdt: body?.priceUsdt ?? Number(book.priceUsdt),
    },
    // Exclude bytes from response
    select: {
      id: true, title: true, description: true, author: true, 
      priceUsdt: true, coverPath: true, pdfPath: true,
      createdAt: true, updatedAt: true
    }
  });

  return NextResponse.json({ book: updated });
}

