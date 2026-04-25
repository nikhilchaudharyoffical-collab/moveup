import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { generateSecureToken } from "@/lib/tokens";

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function mapStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "finished" || s === "confirmed") return "PAID" as const;
  if (s === "expired") return "EXPIRED" as const;
  if (s === "failed" || s === "refunded") return "FAILED" as const;
  return "PENDING" as const;
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (env.NOWPAYMENTS_IPN_SECRET) {
    const theirSig = req.headers.get("x-nowpayments-sig") ?? "";
    const ours = crypto
      .createHmac("sha512", env.NOWPAYMENTS_IPN_SECRET)
      .update(raw)
      .digest("hex");
    if (!theirSig || !safeEqual(theirSig, ours)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(raw) as {
    payment_status?: string;
    payment_id?: number | string;
    order_id?: string;
    pay_address?: string;
    pay_amount?: string;
  };

  const orderId = payload.order_id;
  if (!orderId) {
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { downloadToken: true },
  });
  if (!order) return NextResponse.json({ ok: true });

  const nextStatus = payload.payment_status ? mapStatus(payload.payment_status) : order.status;

  let updated = order;
  updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      nowpaymentsPaymentId: payload.payment_id ? String(payload.payment_id) : order.nowpaymentsPaymentId,
      status: nextStatus,
      paidAt: nextStatus === "PAID" ? order.paidAt ?? new Date() : order.paidAt,
      payAddress: payload.pay_address ?? order.payAddress,
      payAmount: payload.pay_amount ? Number(payload.pay_amount) : order.payAmount,
    },
    include: { downloadToken: true },
  });

  if (updated.status === "PAID" && !updated.downloadToken) {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    updated = await prisma.order.update({
      where: { id: updated.id },
      data: {
        downloadToken: { create: { token, expiresAt } },
      },
      include: { downloadToken: true },
    });
  }

  return NextResponse.json({ ok: true });
}

