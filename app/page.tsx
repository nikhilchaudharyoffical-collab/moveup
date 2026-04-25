import { prisma } from "@/lib/prisma";
import { getOrCreateBook } from "@/lib/book";
import { BookCard } from "@/components/BookCard";

// ✅ Ye line add karo - bilkul top pe
export const dynamic = 'force-dynamic'

export default async function Home() {
  const book = await getOrCreateBook();
  const copiesSold = await prisma.order.count({ where: { status: "PAID" } });

  return (
    <div className="flex flex-1 items-center justify-center bg-[#0a0a0a] px-4 py-10">
      <BookCard
        book={{
          title: book.title,
          description: book.description,
          author: book.author,
          priceUsdt: book.priceUsdt.toString(),
          coverPath: book.coverPath,
        }}
        copiesSold={copiesSold}
      />
    </div>
  );
}