"use client";

import { useState } from "react";
import { Button } from "@/app/design/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";
import { useLang } from "@/app/i18n/useLang";
import { ChevronDown } from "lucide-react";

const PAYMENT_NUMBERS = {
  bkash: "01XXXXXXXXX",
  nagad: "01YYYYYYYYY",
};

export function DepositModal({ open, onClose }) {
  const { t, lang } = useLang();

  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const submit = async () => {
    if (!amount || !trxId) return alert(t.fillAllFields || "Fill all fields");

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
      return alert(err.error || t.failed || "Failed");
    }

    alert(t.depositSent || "Deposit request sent. You will receive balance after approval.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{t.depositFunds || "Deposit Funds"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Payment Method Dropdown */}
          <div className="relative w-full">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex justify-between items-center px-3 py-2 bg-gray-800 rounded border border-white/20 hover:border-emerald-500 focus:outline-none"
            >
              <span>{method === "bkash" ? t.bkash || "bKash" : t.nagad || "Nagad"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute mt-1 w-full bg-gray-800 border border-white/20 rounded shadow-lg z-20 animate-slide-down">
                <button
                  onClick={() => { setMethod("bkash"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-500/20 rounded"
                >
                  {t.bkash || "bKash"}
                </button>
                <button
                  onClick={() => { setMethod("nagad"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-500/20 rounded"
                >
                  {t.nagad || "Nagad"}
                </button>
              </div>
            )}
          </div>

          {/* Payment Number */}
          <div className="text-sm text-gray-400">
            {t.sendMoneyTo || "Send money to:"}
            <div className="font-semibold text-white">{PAYMENT_NUMBERS[method]}</div>
          </div>

          {/* Amount */}
          <input
            placeholder={t.amount || "Amount"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-white/10 focus:border-emerald-500 outline-none"
          />

          {/* Transaction ID */}
          <input
            placeholder={t.transactionId || "Transaction ID"}
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-white/10 focus:border-emerald-500 outline-none"
          />

          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? t.submitting || "Submitting..." : t.submitDeposit || "Submit Deposit"}
          </Button>
        </div>
      </DialogContent>

      <style jsx>{`
        .animate-slide-down {
          animation: slideDown 0.2s ease-out forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Dialog>
  );
}
