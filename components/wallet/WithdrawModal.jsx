"use client";

import { useState } from "react";
import { Button } from "@/app/design/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/design/ui/dialog";

export default function WithdrawModal({ open, onClose }) {
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || !account) {
      alert("Fill all fields");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method,
          amount,
          account,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Withdraw request failed");
      }

      alert(
        "Withdraw request submitted. You will receive money within 1 hour."
      );
      onClose();
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* METHOD */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
          </select>

          {/* ACCOUNT NUMBER */}
          <input
            placeholder={`${method === "bkash" ? "bKash" : "Nagad"} Number`}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />

          {/* AMOUNT */}
          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />

          <p className="text-sm text-gray-400">
            Withdraw requests are processed within 1 hour.
          </p>

          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
