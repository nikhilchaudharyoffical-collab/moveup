import { NextResponse } from "next/server";
import { getTrc20UsdtBalance } from "@/lib/tron";

export async function GET() {
  try {
    const balance = await getTrc20UsdtBalance();
    return NextResponse.json({
      success: true,
      message: "",
      data: { wallet_balance_usdt: balance },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

