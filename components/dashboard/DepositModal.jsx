"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DepositModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // convert ৳ → paisa
        provider: "BKASH",
      }),
    });

    setLoading(false);

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      alert("Deposit failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Deposit Money</h2>

        <input
          type="number"
          min={50}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full mb-4 p-2 rounded bg-gray-800 border border-gray-700"
        />

        <Button
          className="w-full bg-emerald-600"
          disabled={loading}
          onClick={handleDeposit}
        >
          {loading ? "Processing..." : "Confirm Deposit"}
        </Button>

        <button
          className="mt-3 text-sm text-gray-400 w-full"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
