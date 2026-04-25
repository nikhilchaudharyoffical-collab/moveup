import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totals = await prisma.order.groupBy({
    by: ["currency", "status"],
    _sum: { amount: true },
    _count: { _all: true },
  });

  return NextResponse.json({ orders, totals });
}

