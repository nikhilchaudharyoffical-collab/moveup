import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function getOrCreateBook() {
  const existing = await prisma.book.findFirst();
  if (existing) return existing;

  return prisma.book.create({
    data: {
      title: env.BOOK_TITLE,
      description: env.BOOK_DESCRIPTION,
      author: env.BOOK_AUTHOR,
      priceUsdt: env.BOOK_PRICE_USDT,
    },
  });
}

