import { env } from "@/lib/env";

const BASE_URL = "https://api.nowpayments.io/v1";

export type NowPaymentsCurrency = "USDT";

function payCurrencyCode() {
  // USDT on Tron
  return "usdttrc20";
}

export async function nowpaymentsCreatePayment(input: {
  orderId: string;
  priceAmount: number;
  priceCurrency?: string;
  payCurrency: NowPaymentsCurrency;
  ipnCallbackUrl?: string;
}) {
  if (!env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY is not set");
  }

  const res = await fetch(`${BASE_URL}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.NOWPAYMENTS_API_KEY,
    },
    body: JSON.stringify({
      price_amount: input.priceAmount,
      price_currency: input.priceCurrency ?? "usd",
      pay_currency: payCurrencyCode(),
      order_id: input.orderId,
      order_description: "Ebook purchase",
      ipn_callback_url: input.ipnCallbackUrl,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments create payment failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    payment_id: number;
    payment_status: string;
    pay_address?: string;
    pay_amount?: string;
    expiration_estimate_date?: string;
  };
}

export async function nowpaymentsGetPayment(paymentId: string | number) {
  if (!env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY is not set");
  }

  const res = await fetch(`${BASE_URL}/payment/${paymentId}`, {
    headers: {
      "x-api-key": env.NOWPAYMENTS_API_KEY,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments get payment failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    payment_id: number;
    payment_status: string;
    order_id?: string;
    pay_address?: string;
    pay_amount?: string;
    actually_paid?: string;
    created_at?: string;
    updated_at?: string;
    outcome_amount?: string;
    outcome_currency?: string;
  };
}

