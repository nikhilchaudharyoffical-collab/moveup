import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind } = await params;

  if (kind !== "cover" && kind !== "pdf") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const book = await prisma.book.findFirst({
    select: {
      coverData: kind === "cover",
      pdfData: kind === "pdf",
    },
  });

  if (!book) return new NextResponse("Not Found", { status: 404 });

  const data = kind === "cover" ? book.coverData : book.pdfData;
  if (!data) return new NextResponse("Not Found", { status: 404 });

  const contentType = kind === "cover" ? "image/jpeg" : "application/pdf";

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
