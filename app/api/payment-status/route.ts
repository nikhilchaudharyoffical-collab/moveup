import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowpaymentsGetPayment } from "@/lib/nowpayments";
import { generateSecureToken } from "@/lib/tokens";

function mapStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "finished" || s === "confirmed") return "PAID" as const;
  if (s === "expired") return "EXPIRED" as const;
  if (s === "failed" || s === "refunded") return "FAILED" as const;
  return "PENDING" as const;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  const orderId = url.searchParams.get("orderId");

  if (!paymentId || !orderId) {
    return NextResponse.json({ error: "paymentId and orderId are required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { downloadToken: true },
  });

  if (!order || order.nowpaymentsPaymentId !== paymentId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payment = await nowpaymentsGetPayment(paymentId);
  const nextStatus = mapStatus(payment.payment_status);

  let updated = order;
  if (order.status !== nextStatus) {
    updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === "PAID" ? new Date() : order.paidAt,
        payAddress: payment.pay_address ?? order.payAddress,
        payAmount: payment.pay_amount ? Number(payment.pay_amount) : order.payAmount,
      },
      include: { downloadToken: true },
    });
  }

  if (updated.status === "PAID" && !updated.downloadToken) {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    updated = await prisma.order.update({
      where: { id: updated.id },
      data: {
        paidAt: updated.paidAt ?? new Date(),
        downloadToken: {
          create: { token, expiresAt },
        },
      },
      include: { downloadToken: true },
    });
  }

  return NextResponse.json({
    orderId: updated.id,
    status: updated.status,
    payAddress: updated.payAddress,
    payAmount: updated.payAmount,
    downloadUrl: updated.downloadToken ? `/api/download/${updated.downloadToken.token}` : null,
    downloadExpiresAt: updated.downloadToken?.expiresAt ?? null,
  });
}

