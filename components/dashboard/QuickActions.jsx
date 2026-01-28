"use client";

import { Wallet, ArrowDown, History, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DepositModal } from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";
import { useLang } from "@/app/i18n/useLang";

export function QuickActions() {
  const router = useRouter();

  const lang = useLang();
  const t = lang?.t || {}; // ✅ SAFE

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <>
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

      <section className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setDepositOpen(true)}
          className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
        >
          <Wallet className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm font-medium">
            {t.deposit ?? "Deposit"}
          </span>
        </button>

        <button
          onClick={() => setWithdrawOpen(true)}
          className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
        >
          <ArrowDown className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm font-medium">
            {t.withdraw ?? "Withdraw"}
          </span>
        </button>

        <button
          onClick={() => router.push("/dashboard/transactions")}
          className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
        >
          <History className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm font-medium">
            {t.history ?? "History"}
          </span>
        </button>

        <button
          onClick={() => router.push("/dashboard/payment")}
          className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
        >
          <Banknote className="mx-auto mb-2 text-emerald-400" />
          <span className="text-sm font-medium">
            {t.paymentSetup ?? "Payment Setup"}
          </span>
        </button>
      </section>
    </>
  );
}
