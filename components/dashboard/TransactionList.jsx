"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";
import { ArrowDown, ArrowUp, DollarSign, X } from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export function TransactionList({ transactions }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const types = [
    {
      key: "deposit",
      label: t.depositRecords || "Deposit Records",
      icon: <ArrowDown className="h-5 w-5 text-emerald-400" />,
      filter: (tx) => (tx.type ?? "").toUpperCase() === "DEPOSIT",
      color: "bg-emerald-800 hover:bg-emerald-700",
      showTotal: true,
    },
    {
      key: "withdraw",
      label: t.withdrawRecords || "Withdraw Records",
      icon: <ArrowUp className="h-5 w-5 text-blue-400" />,
      filter: (tx) => (tx.type ?? "").toUpperCase() === "WITHDRAW",
      color: "bg-blue-800 hover:bg-blue-700",
      showTotal: true,
    },
    {
      key: "earnings",
      label: t.earnings || "Earnings",
      icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
      filter: (tx) => (tx.type ?? "").toUpperCase() === "WIN",
      color: "bg-emerald-900 hover:bg-emerald-700",
      showTotal: true,
    },
    {
      key: "losses",
      label: t.losses || "Losses",
      icon: <DollarSign className="h-5 w-5 text-red-400 rotate-180" />,
      filter: (tx) => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const type = tx.type ?? "";
        const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
        return type.toUpperCase() === "LOSS" && createdAt && createdAt >= twentyFourHoursAgo;
      },
      color: "bg-red-900 hover:bg-red-700",
    },
  ];

  const openModal = (type) => {
    setSelectedType(type);
    setOpen(true);
  };

  // Filtered transactions safely
  const filtered = selectedType
    ? transactions.filter(selectedType.filter)
    : [];

  // Total amounts safely
  const totalAmount = useMemo(() => {
    if (!selectedType?.showTotal) return 0;
    return filtered.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
  }, [filtered, selectedType]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{t.recentTransactions || "Recent Transactions"}</h2>

      {/* BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {types.map((type) => (
          <button
            key={type.key}
            onClick={() => openModal(type)}
            className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl shadow-md transition ${type.color}`}
          >
            {type.icon}
            <span className="text-white text-sm font-semibold text-center">
              {type.label}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-4">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-white">{selectedType?.label}</DialogTitle>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          {/* Show total amount for deposits, withdrawals, or earnings */}
          {selectedType?.showTotal && filtered.length > 0 && (
            <div className="text-lg font-bold my-2 text-white/90">
              {selectedType.key === "earnings" && `${t.totalWins || "Total Wins"}: ৳ ${(totalAmount / 100).toFixed(2)}`}
              {selectedType.key === "withdraw" && `${t.totalWithdraw || "Total Withdraw"}: ৳ ${(totalAmount / 100).toFixed(2)}`}
              {selectedType.key === "deposit" && `${t.totalDeposit || "Total Deposit"}: ৳ ${(totalAmount / 100).toFixed(2)}`}
            </div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto mt-2">
            {filtered.length === 0 ? (
              <p className="text-white/40 p-4">
                {selectedType?.key === "losses"
                  ? t.noTransactions48h || "No losses in last 48 hours"
                  : t.noTransactions || "No transactions yet"}
              </p>
            ) : (
              filtered.map((tx) => {
                const type = tx.type ?? "UNKNOWN";
                const amount = tx.amount ?? 0;
                const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
                const status = tx.status ?? "Unknown";

                return (
                  <div
                    key={tx.id}
                    className={`flex justify-between items-center p-3 rounded-lg hover:bg-gray-800 transition ${
                      amount > 0 ? "bg-emerald-800/20" : "bg-red-800/20"
                    }`}
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{type}</p>
                      <p className="text-xs text-white/60">
                        {status} - {createdAt.toLocaleString()}
                      </p>
                      {tx.provider && <p className="text-xs text-white/50">({tx.provider})</p>}
                    </div>
                    <p className={`font-semibold ${amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ৳ {(amount / 100).toFixed(2)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
