import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateBook } from "@/lib/book";
import { nowpaymentsCreatePayment, type NowPaymentsCurrency } from "@/lib/nowpayments";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { currency?: NowPaymentsCurrency }
    | null;

  const currency = body?.currency ?? "USDT";
  if (currency !== "USDT") return NextResponse.json({ error: "Only USDT is supported" }, { status: 400 });

  const book = await getOrCreateBook();
  const amount = Number(book.priceUsdt);

  const order = await prisma.order.create({
    data: {
      currency,
      amount,
      status: "PENDING",
    },
  });

  const origin = new URL(req.url).origin;
  const ipnCallbackUrl = `${origin}/api/nowpayments-webhook`;

  const payment = await nowpaymentsCreatePayment({
    orderId: order.id,
    priceAmount: amount,
    priceCurrency: "usdt",
    payCurrency: currency,
    ipnCallbackUrl,
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      nowpaymentsPaymentId: String(payment.payment_id),
      payAddress: payment.pay_address ?? null,
      payAmount: payment.pay_amount ? Number(payment.pay_amount) : null,
    },
  });

  return NextResponse.json({
    orderId: updated.id,
    paymentId: updated.nowpaymentsPaymentId,
    payAddress: updated.payAddress,
    payAmount: updated.payAmount,
    expiresAt: payment.expiration_estimate_date ?? null,
  });
}

