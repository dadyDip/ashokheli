"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export function TransactionList({ transactions }) {
  const { t, lang } = useLang();
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
    }
  ];

  const openModal = (type) => {
    setSelectedType(type);
    setOpen(true);
  };

  // Filtered transactions - ALL TIME, no date restrictions
  const filtered = selectedType
    ? transactions.filter(selectedType.filter)
    : [];

  // Total amounts for ALL TIME
  const totalAmount = useMemo(() => {
    if (!selectedType?.showTotal) return 0;
    return filtered.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
  }, [filtered, selectedType]);

  // Sort transactions by date (newest first)
  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
  }, [filtered]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return lang === 'bn' ? 'আজ' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return lang === 'bn' ? 'গতকাল' : 'Yesterday';
    } else {
      return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{t.recentTransactions || "Recent Transactions"}</h2>

      {/* BUTTONS - Only 2 now */}
      <div className="grid grid-cols-2 gap-3">
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

          {/* Show total amount - ALL TIME */}
          {selectedType?.showTotal && sortedFiltered.length > 0 && (
            <div className="text-lg font-bold my-2 text-white/90 p-3 bg-white/5 rounded-lg">
              {selectedType.key === "withdraw" && `${t.totalWithdraw || "Total Withdrawn"}: ৳ ${(totalAmount / 100).toFixed(2)}`}
              {selectedType.key === "deposit" && `${t.totalDeposit || "Total Deposited"}: ৳ ${(totalAmount / 100).toFixed(2)}`}
              <span className="text-xs text-white/50 ml-2">
                ({sortedFiltered.length} {sortedFiltered.length === 1 ? 'transaction' : 'transactions'})
              </span>
            </div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto mt-2">
            {sortedFiltered.length === 0 ? (
              <p className="text-white/40 p-4 text-center">
                {t.noTransactions || "No transactions yet"}
              </p>
            ) : (
              sortedFiltered.map((tx) => {
                const type = tx.type ?? "UNKNOWN";
                const amount = tx.amount ?? 0;
                const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
                const status = tx.status ?? "Unknown";
                const isDeposit = type.toUpperCase() === "DEPOSIT";

                return (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition border border-white/5"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {isDeposit ? (
                          <ArrowDown className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ArrowUp className="h-4 w-4 text-blue-400" />
                        )}
                        <p className="font-medium text-sm text-white">
                          {type}
                        </p>
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {formatDate(createdAt)} at {formatTime(createdAt)}
                      </p>
                      {tx.provider && (
                        <p className="text-xs text-white/40 mt-0.5">
                          via {tx.provider} {tx.reference && `• ${tx.reference.slice(-4)}`}
                        </p>
                      )}
                      <p className="text-xs text-white/40 mt-0.5">
                        Status: <span className={`${status === 'APPROVED' ? 'text-emerald-400' : status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-blue-400'}`}>
                        ৳ {(amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {tx.id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary Footer */}
          {sortedFiltered.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/40 text-center">
              {t.showingAll || "Showing all records from account creation"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}