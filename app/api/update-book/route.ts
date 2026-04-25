import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateBook } from "@/lib/book";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { title?: string; description?: string; price?: number }
      | null;

    if (!body) {
      return NextResponse.json({ success: false, message: "Missing JSON body" }, { status: 400 });
    }

    const book = await getOrCreateBook();

    const nextTitle = typeof body.title === "string" ? body.title.trim() : undefined;
    const nextDesc = typeof body.description === "string" ? body.description.trim() : undefined;
    const nextPrice = typeof body.price === "number" && Number.isFinite(body.price) ? body.price : undefined;

    const updated = await prisma.book.update({
      where: { id: book.id },
      data: {
        title: nextTitle ?? book.title,
        description: nextDesc ?? book.description,
        priceUsdt: nextPrice ?? Number(book.priceUsdt),
      },
    });

    return NextResponse.json({
      success: true,
      message: "",
      data: {
        book: {
          title: updated.title,
          description: updated.description,
          author: updated.author,
          priceUsdt: updated.priceUsdt.toString(),
          coverPath: updated.coverPath,
          pdfPath: updated.pdfPath,
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

