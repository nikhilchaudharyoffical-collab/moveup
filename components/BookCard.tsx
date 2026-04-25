"use client";

import Image from "next/image";
import { useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";

export type BookCardProps = {
  book: {
    title: string;
    description: string;
    author: string;
    priceUsdt: string | number;
    coverPath: string | null;
  };
  copiesSold: number;
};

export function BookCard({ book, copiesSold }: BookCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(0,255,136,0.08),0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {book.coverPath ? (
              <Image
                src={book.coverPath}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 420px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
                Upload a cover in /admin
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{book.title}</h1>
              <span className="rounded-full bg-[#00ff88]/10 px-3 py-1 text-xs font-medium text-[#00ff88]">
                {copiesSold} sold
              </span>
            </div>
            <p className="text-sm leading-6 text-white/70">{book.description}</p>
            <p className="text-sm font-medium text-white/80">{book.author}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-white">
              {Number(book.priceUsdt)} <span className="text-white/70">USDT</span>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="rounded-2xl bg-[#00ff88] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 active:brightness-95"
            >
              Buy Now
            </button>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-xs text-white/40">Powered by crypto</span>
          </div>
        </div>
      </div>

      <PaymentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

