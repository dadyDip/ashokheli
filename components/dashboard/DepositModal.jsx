"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/app/i18n/useLang";

export function DepositModal({ open = true, onClose, onSuccess }) {
  const { t } = useLang();

  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const minAmount = 50;

  if (!open) return null;

  const handleDeposit = async () => {
    if (amount < minAmount) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // ৳ → paisa
          provider: "BKASH",
        }),
      });

      if (!res.ok) throw new Error("Deposit failed");

      onSuccess?.();
      onClose();
    } catch (err) {
      alert(t.depositFailed || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      
      {/* CARD */}
      <div
        className="
          w-full sm:max-w-sm
          bg-gray-900 border border-emerald-500/20
          rounded-t-2xl sm:rounded-2xl
          p-6
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {t.depositMoney || "Deposit Money"}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X />
          </button>
        </div>

        {/* AMOUNT INPUT */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-1">
            {t.amount || "Amount"}
          </label>

          <div className="flex items-center rounded-lg bg-gray-800 border border-white/10 focus-within:border-emerald-500">
            <span className="px-3 text-white/60">৳</span>
            <input
              type="number"
              min={minAmount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="
                w-full bg-transparent p-2 outline-none
                text-white placeholder-white/40
              "
              placeholder="500"
            />
          </div>

          {amount < minAmount && (
            <p className="text-xs text-red-400 mt-1">
              {t.minDeposit || "Minimum deposit ৳50"}
            </p>
          )}
        </div>

        {/* PROVIDER */}
        <div className="mb-5 text-sm text-white/60">
          {t.paymentMethod || "Payment Method"}:{" "}
          <span className="text-white font-medium">bKash</span>
        </div>

        {/* ACTION */}
        <Button
          onClick={handleDeposit}
          disabled={loading || amount < minAmount}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading
            ? t.processing || "Processing..."
            : t.confirmDeposit || "Confirm Deposit"}
        </Button>

        {/* CANCEL */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-white/50 hover:text-white"
        >
          {t.cancel || "Cancel"}
        </button>
      </div>
    </div>
  );
}
