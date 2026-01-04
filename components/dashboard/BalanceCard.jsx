"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export function BalanceCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    authFetch("/api/wallet/summary")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl bg-emerald-900/20 p-6 animate-pulse">
        Loading balance…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-emerald-900/30 p-6 border border-emerald-500/20">
      <div className="text-sm text-white/60">Demo Balance</div>

      <div className="text-4xl font-bold mt-2">
        ৳ {(data.balance / 100).toFixed(2)}
      </div>

      <div className="flex gap-6 mt-4 text-sm text-white/70">
        <div>
          Total Deposited: ৳ {(data.totalDeposited / 100).toFixed(2)}
        </div>
        <div>
          Total Withdrawn: ৳ {(data.totalWithdrawn / 100).toFixed(2)}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button disabled className="btn-primary opacity-60">
          Deposit
        </button>
        <button disabled className="btn-outline opacity-60">
          Withdraw
        </button>
      </div>
    </div>
  );
}
