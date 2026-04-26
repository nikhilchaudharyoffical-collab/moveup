import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const EXCLUDE_DATA = {
  select: {
    id: true, title: true, description: true, author: true, 
    priceUsdt: true, coverPath: true, pdfPath: true,
    createdAt: true, updatedAt: true
  }
};

export async function getOrCreateBook() {
  const existing = await prisma.book.findFirst(EXCLUDE_DATA);
  if (existing) return existing;

  return prisma.book.create({
    data: {
      title: env.BOOK_TITLE,
      description: env.BOOK_DESCRIPTION,
      author: env.BOOK_AUTHOR,
      priceUsdt: env.BOOK_PRICE_USDT,
    },
    ...EXCLUDE_DATA,
  });
}

