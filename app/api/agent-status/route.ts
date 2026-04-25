import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrc20UsdtBalance } from "@/lib/tron";

export async function GET() {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [walletBalance, totalPaid, last7dCount, last24hPaid, lastPaid] = await Promise.all([
      getTrc20UsdtBalance(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "PAID", paidAt: { gte: since7d } } }),
      prisma.order.findMany({
        where: { status: "PAID", paidAt: { gte: since24h } },
        select: { id: true, amount: true, currency: true, paidAt: true },
        orderBy: { paidAt: "asc" },
      }),
      prisma.order.findFirst({
        where: { status: "PAID", paidAt: { not: null } },
        orderBy: { paidAt: "desc" },
        select: { paidAt: true },
      }),
    ]);

    const hourly = Array.from({ length: 24 }, () => 0);
    for (const o of last24hPaid) {
      if (!o.paidAt) continue;
      const diffMs = o.paidAt.getTime() - since24h.getTime();
      const idx = Math.floor(diffMs / (60 * 60 * 1000));
      if (idx >= 0 && idx < 24) hourly[idx] += 1;
    }

    const lastSaleTs = lastPaid?.paidAt ?? null;
    const daysWithoutSale =
      lastSaleTs == null ? null : Math.floor((now.getTime() - lastSaleTs.getTime()) / (24 * 60 * 60 * 1000));

    return NextResponse.json({
      success: true,
      message: "",
      data: {
        wallet: {
          wallet_balance_usdt: walletBalance,
        },
        sales: {
          total_sales_count: totalPaid,
          sales_last_24h: last24hPaid.length,
          sales_last_7_days: last7dCount,
          last_sale_timestamp: lastSaleTs ? lastSaleTs.toISOString() : null,
          days_without_sale: daysWithoutSale,
          hourly_sales: hourly,
          raw_last_24h_paid_orders: last24hPaid.map((o) => ({
            id: o.id,
            amount: o.amount.toString(),
            currency: o.currency,
            paidAt: o.paidAt ? o.paidAt.toISOString() : null,
          })),
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

