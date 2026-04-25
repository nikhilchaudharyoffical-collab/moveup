"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Currency = "USDT";

type CreatePaymentResponse = {
  orderId: string;
  paymentId: string | null;
  payAddress: string | null;
  payAmount: number | null;
  expiresAt: string | null;
};

type PaymentStatusResponse = {
  orderId: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  payAddress: string | null;
  payAmount: number | null;
  downloadUrl: string | null;
  downloadExpiresAt: string | null;
};

export function PaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"choose" | "pay">("choose");
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const secondsLeft = useMemo(() => {
    if (!startedAt) return 15 * 60;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, 15 * 60 - elapsed);
  }, [startedAt, tick]);

  function reset() {
    setStep("choose");
    setCurrency(null);
    setLoading(false);
    setErr(null);
    setPayment(null);
    setStatus(null);
    setStartedAt(null);
    setTick(0);
  }

  useEffect(() => {
    if (!open) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [open]);

  function handleClose() {
    reset();
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    onClose();
  }

  async function create(c: Currency) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: c }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as CreatePaymentResponse;
      setCurrency(c);
      setPayment(json);
      setStep("pay");
      setStartedAt(Date.now());
      tickRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
      await refreshStatus(json.orderId, json.paymentId);
      pollRef.current = window.setInterval(() => refreshStatus(json.orderId, json.paymentId), 10_000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create payment");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus(orderId: string, paymentId: string | null) {
    if (!paymentId) return;
    const res = await fetch(`/api/payment-status?orderId=${encodeURIComponent(orderId)}&paymentId=${encodeURIComponent(paymentId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const json = (await res.json()) as PaymentStatusResponse;
    setStatus(json);
    if (json.status === "PAID" || json.status === "EXPIRED" || json.status === "FAILED") {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  const address = status?.payAddress ?? payment?.payAddress ?? null;
  const payAmount = status?.payAmount ?? payment?.payAmount ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="text-sm font-semibold text-white">Pay with crypto</div>
              <button onClick={handleClose} className="text-sm text-white/60 hover:text-white">
                Close
              </button>
            </div>

            <div className="p-6">
              {err ? (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}

              {step === "choose" ? (
                <div className="flex flex-col gap-4">
                  <div className="text-white/70">
                    We’ll generate a USDT address + QR code, then confirm automatically.
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      disabled={loading}
                      onClick={() => create("USDT")}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-white transition hover:border-[#00ff88]/40 hover:bg-white/10 disabled:opacity-50"
                    >
                      <div className="text-sm font-semibold">Pay with USDT</div>
                      <div className="text-xs text-white/50">TRC-20 (recommended)</div>
                    </button>
                  </div>

                  <div className="text-xs text-white/40">You have 15 minutes to complete payment.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{currency} payment</div>
                    <div className="rounded-full bg-[#00ff88]/10 px-3 py-1 text-xs font-medium text-[#00ff88]">
                      {Math.floor(secondsLeft / 60)
                        .toString()
                        .padStart(2, "0")}
                      :{(secondsLeft % 60).toString().padStart(2, "0")}
                    </div>
                  </div>

                  {address ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 text-xs font-medium text-white/60">Send to address</div>
                        <div className="break-all text-sm text-white">{address}</div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                          {payAmount ? (
                            <>
                              Amount: <span className="text-white">{payAmount}</span>
                            </>
                          ) : (
                            "Amount shown in your invoice"
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white p-3">
                        <QRCodeCanvas value={address} size={176} includeMargin />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      Generating address…
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-1 text-xs font-medium text-white/60">Status</div>
                    <div className="text-sm text-white">
                      {status?.status === "PAID"
                        ? "Payment confirmed"
                        : status?.status === "EXPIRED"
                          ? "Invoice expired"
                          : status?.status === "FAILED"
                            ? "Payment failed"
                            : "Waiting for payment… (auto-refreshing)"}
                    </div>

                    {status?.downloadUrl && status.status === "PAID" ? (
                      <a
                        href={status.downloadUrl}
                        className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#00ff88] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 active:brightness-95"
                      >
                        Download ebook (one-time link)
                      </a>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (payment?.orderId && payment?.paymentId) void refreshStatus(payment.orderId, payment.paymentId);
                      }}
                      className="text-sm text-white/60 hover:text-white"
                    >
                      Refresh now
                    </button>
                    <button
                      onClick={() => {
                        reset();
                      }}
                      className="text-sm text-white/60 hover:text-white"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

