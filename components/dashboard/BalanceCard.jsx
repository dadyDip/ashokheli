"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { authFetch } from "@/lib/api";
import { useLang } from "@/app/i18n/useLang";

export function BalanceCard({ lang = "en" }) {
  const {t} = useLang();

  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    authFetch("/api/wallet/summary")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setData)
      .catch(() => {});
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  if (!data) {
    return (
      <div className="rounded-2xl bg-emerald-900/20 p-6 animate-pulse">
        {t.loadingBalance || "Loading balance…"}
      </div>
    );
  }

  const balance = (data.balance / 100).toFixed(2);

  return (
    <div
      className="
        rounded-2xl border border-emerald-500/20
        bg-gradient-to-br from-emerald-900/30 to-gray-900
        p-6 flex flex-col sm:flex-row gap-6
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4 sm:w-1/2">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full overflow-hidden
                        border border-emerald-500/30 bg-gray-800">
          <img
            src={data.avatar || "/p-av.jpeg"}
            alt="Player Avatar"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/p-av.jpeg";
            }}
          />
        </div>
        {/* User Info (ALWAYS ENGLISH) */}
        <div className="space-y-1 text-sm">
          {/* NAME */}
          <div className="text-white font-semibold text-base">
            {data.firstName} {data.lastName}
          </div>

          {/* USER ID */}
          <div className="flex items-center gap-2 text-white/60">
            <span>User ID:</span>
              <span className="font-medium text-white">
                {data.id ? `${data.id.slice(0, 8)}…` : "Unknown ID"}
              </span>
            <button onClick={() => copy(data.id, "uid")}>
              {copied === "uid" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-white/40 hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="sm:w-1/2 flex flex-col justify-between">
        <div className="text-right">
          <div className="text-sm text-white/60">
            {t.demoBalance || "Demo Balance"}
          </div>
          <div className="text-4xl font-bold mt-1">
            ৳ {balance}
          </div>
        </div>

        <div className="flex justify-end gap-6 mt-4 text-sm text-white/70">
          <div>
            {t.totalDeposited || "Deposited"}: ৳{" "}
            {(data.totalDeposited / 100).toFixed(2)}
          </div>
          <div>
            {t.totalWithdrawn || "Withdrawn"}: ৳{" "}
            {(data.totalWithdrawn / 100).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
