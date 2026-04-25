"use client";

import { useEffect, useState } from "react";

type AgentStatus = {
  wallet_balance_usdt: number;
  total_sales_count: number;
};

export function HealthDashboard() {
  const [data, setData] = useState<AgentStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/agent-status")
      .then((r) => r.json())
      .then((j) => {
        if (mounted) setData(j as AgentStatus);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-5">
      <div className="text-sm font-semibold text-white">Health</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/80">
        <div>
          <div className="text-xs text-white/50">Wallet (USDT)</div>
          <div className="font-semibold text-white">{data.wallet_balance_usdt}</div>
        </div>
        <div>
          <div className="text-xs text-white/50">Total sales</div>
          <div className="font-semibold text-white">{data.total_sales_count}</div>
        </div>
      </div>
    </div>
  );
}

