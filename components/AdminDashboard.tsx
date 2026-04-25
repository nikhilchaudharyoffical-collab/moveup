"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { HealthDashboard } from "@/components/HealthDashboard";

type Book = {
  id: number;
  title: string;
  description: string;
  author: string;
  priceUsdt: string;
  coverPath: string | null;
  pdfPath: string | null;
};

type Order = {
  id: string;
  currency: string;
  amount: string;
  status: string;
  createdAt: string;
};

export function AdminDashboard() {
  const [book, setBook] = useState<Book | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const totalPaidByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "PAID") continue;
      map.set(o.currency, (map.get(o.currency) ?? 0) + Number(o.amount));
    }
    return Array.from(map.entries());
  }, [orders]);

  async function fetchAll() {
    const [b, o] = await Promise.all([
      fetch("/api/admin/book").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
    ]);
    return { book: b.book as Book, orders: (o.orders ?? []) as Order[] };
  }

  async function loadAll() {
    const data = await fetchAll();
    setBook(data.book);
    setOrders(data.orders);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchAll();
      if (!cancelled) {
        setBook(data.book);
        setOrders(data.orders);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveBook() {
    if (!book) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: book.title,
        description: book.description,
        author: book.author,
        priceUsdt: Number(book.priceUsdt),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Saved");
      await loadAll();
    } else {
      setMsg("Save failed");
    }
  }

  async function upload(kind: "cover" | "pdf", file: File) {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) await loadAll();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  if (!book) {
    return <div className="text-white/60">Loading…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/50">Upload assets, edit details, track orders.</p>
        </div>
        <button onClick={logout} className="text-sm text-white/60 hover:text-white">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="flex items-start gap-5">
            <div className="relative h-36 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {book.coverPath ? <Image src={book.coverPath} alt="Cover" fill className="object-cover" /> : null}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">Title</span>
                  <input
                    value={book.title}
                    onChange={(e) => setBook({ ...book, title: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#00ff88]/40"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">Author</span>
                  <input
                    value={book.author}
                    onChange={(e) => setBook({ ...book, author: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#00ff88]/40"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-white/50">Description</span>
                <textarea
                  value={book.description}
                  onChange={(e) => setBook({ ...book, description: e.target.value })}
                  rows={3}
                  className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#00ff88]/40"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">Price (USDT)</span>
                  <input
                    value={book.priceUsdt}
                    onChange={(e) => setBook({ ...book, priceUsdt: e.target.value })}
                    inputMode="decimal"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#00ff88]/40"
                  />
                </label>

                <div className="flex items-end justify-end gap-3">
                  <button
                    disabled={saving}
                    onClick={saveBook}
                    className="rounded-2xl bg-[#00ff88] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {msg ? <div className="text-xs text-white/50">{msg}</div> : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Upload cover</div>
              <div className="mt-2 text-xs text-white/50">JPG/PNG recommended.</div>
              <input
                type="file"
                accept="image/*"
                className="mt-3 text-sm text-white/70"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload("cover", f);
                }}
              />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Upload ebook PDF</div>
              <div className="mt-2 text-xs text-white/50">Used for one-time download link.</div>
              <input
                type="file"
                accept="application/pdf"
                className="mt-3 text-sm text-white/70"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload("pdf", f);
                }}
              />
            </label>
          </div>
        </div>

        <HealthDashboard />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Orders</div>
            <div className="text-sm text-white/50">Latest 200 orders</div>
          </div>
          <div className="text-sm text-white/60">
            Earnings:{" "}
            {totalPaidByCurrency.length ? (
              totalPaidByCurrency.map(([c, a]) => (
                <span key={c} className="ml-2 rounded-full bg-white/5 px-3 py-1 text-white">
                  {a.toFixed(2)} {c}
                </span>
              ))
            ) : (
              <span className="ml-2 text-white/40">—</span>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Currency</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="py-2">{Number(o.amount).toFixed(2)}</td>
                  <td className="py-2">{o.currency}</td>
                  <td className="py-2">
                    <span
                      className={
                        o.status === "PAID"
                          ? "text-[#00ff88]"
                          : o.status === "PENDING"
                            ? "text-white/70"
                            : "text-white/40"
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

