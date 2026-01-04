"use client";

import { Wallet, ArrowDown, History, Banknote, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DepositModal } from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";

export function QuickActions() {
  const router = useRouter();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <>
      {/* MODALS (kept but never opened) */}
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

      <section className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* DEPOSIT */}
        <button
          disabled
          className="relative rounded-xl bg-gray-900/50 backdrop-blur
          border border-emerald-500/20 p-4
          text-center opacity-60 cursor-not-allowed"
        >
          <Lock className="absolute top-2 right-2 h-4 w-4 text-emerald-400" />
          <Wallet className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm">Deposit</span>
        </button>

        {/* WITHDRAW */}
        <button
          disabled
          className="relative rounded-xl bg-gray-900/50 backdrop-blur
          border border-emerald-500/20 p-4
          text-center opacity-60 cursor-not-allowed"
        >
          <Lock className="absolute top-2 right-2 h-4 w-4 text-emerald-400" />
          <ArrowDown className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm">Withdraw</span>
        </button>

        {/* HISTORY */}
        <button
          disabled
          className="relative rounded-xl bg-gray-900/50 backdrop-blur
          border border-emerald-500/20 p-4
          text-center opacity-60 cursor-not-allowed"
        >
          <Lock className="absolute top-2 right-2 h-4 w-4 text-emerald-400" />
          <History className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm">History</span>
        </button>

        {/* PAYMENT SETUP */}
        <button
          disabled
          className="relative rounded-xl bg-gray-900/50 backdrop-blur
          border border-emerald-500/20 p-4
          text-center opacity-60 cursor-not-allowed"
        >
          <Lock className="absolute top-2 right-2 h-4 w-4 text-emerald-400" />
          <Banknote className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm">Payment Setup</span>
        </button>

      </section>
    </>
  );
}
