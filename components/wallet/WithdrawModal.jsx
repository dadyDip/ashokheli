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

export default function WithdrawModal({ open, onClose }) {
  const { t } = useLang();

  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const submit = async () => {
    if (!amount || !account) return alert(t.fillAllFields || "Please fill all fields");

    const token = localStorage.getItem("token");
    if (!token) return alert(t.unauthorized || "Unauthorized");

    setLoading(true);

    try {
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method, amount, account }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || t.withdrawFailed || "Withdraw failed");
      }

      alert(t.withdrawSubmitted || "Withdraw request submitted. You will receive money within 1 hour.");
      onClose();
    } catch (err) {
      alert(err.message || t.somethingWentWrong || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full bg-gray-900 border border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">{t.withdrawFunds || "Withdraw Funds"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Payment Method Dropdown */}
          <div className="relative w-full">
            <label className="text-sm text-white/70">{t.paymentMethod || "Payment Method"}</label>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex justify-between items-center mt-1 px-3 py-2 bg-gray-800 rounded border border-white/20 hover:border-emerald-500 focus:outline-none"
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

          {/* Account Number */}
          <div>
            <label className="text-sm text-white/70">
              {method === "bkash" ? t.bkashNumber || "bKash Number" : t.nagadNumber || "Nagad Number"}
            </label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full mt-1 p-2 bg-gray-800 rounded border border-white/10 text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-white/70">{t.amount || "Amount"}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.enterAmount || "Enter amount"}
              className="w-full mt-1 p-2 bg-gray-800 rounded border border-white/10 text-white outline-none focus:border-emerald-500"
            />
          </div>

          <p className="text-xs text-white/50">{t.withdrawInfo || "Withdraw requests are processed within 1 hour."}</p>

          <Button onClick={submit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500">
            {loading ? t.submitting || "Submitting..." : t.submitWithdraw || "Submit Withdraw"}
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
