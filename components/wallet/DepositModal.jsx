"use client";

import { useState } from "react";
import { Button } from"@/app/design/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";

const PAYMENT_NUMBERS = {
  bkash: "01XXXXXXXXX",
  nagad: "01YYYYYYYYY",
};

export function DepositModal({ open, onClose }) {
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || !trxId) return alert("Fill all fields");

    setLoading(true);

    const res = await fetch("/api/deposit/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ method, amount, trxId }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || "Failed");
    }

    alert("Deposit request sent. You will receive balance after approval.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
          </select>

          <div className="text-sm text-gray-400">
            Send money to:
            <div className="font-semibold text-white">
              {PAYMENT_NUMBERS[method]}
            </div>
          </div>

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />

          <input
            placeholder="Transaction ID"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />

          <Button onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Deposit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
