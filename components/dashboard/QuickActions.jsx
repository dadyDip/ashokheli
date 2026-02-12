"use client";

import { Wallet, ArrowDown, History, Banknote, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { DepositModal } from "@/components/wallet/DepositModal";
import { useLang } from "@/app/i18n/useLang";

export function QuickActions() {
  const router = useRouter();
  const lang = useLang();
  const t = lang?.t || {};

  return (
    <section className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-4">
      <Link
        href="/deposit"
        className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
      >
        <Wallet className="mx-auto mb-2 text-emerald-400" />
        <span className="text-sm font-medium">
          {t.deposit ?? "Deposit"}
        </span>
      </Link>

      <Link
        href="/dashboard/withdraw"
        className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
      >
        <ArrowDown className="mx-auto mb-2 text-emerald-400" />
        <span className="text-sm font-medium">
          {t.withdraw ?? "Withdraw"}
        </span>
      </Link>

      <Link
        href="/dashboard/betting-records"
        className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
      >
        <History className="mx-auto mb-2 text-emerald-400" />
        <span className="text-sm font-medium">
          {t.bettingRecords ?? "Betting Records"}
        </span>
      </Link>

      <Link
        href="/dashboard/payment"
        className="rounded-xl bg-gray-900/70 backdrop-blur border border-emerald-500/30 p-4 text-center hover:bg-emerald-500/10 transition"
      >
        <Banknote className="mx-auto mb-2 text-emerald-400" />
        <span className="text-sm font-medium">
          {t.paymentSetup ?? "Payment Setup"}
        </span>
      </Link>

      <Link
        href="/share"
        className="rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 border border-yellow-500/50 p-4 text-center hover:from-yellow-500 hover:to-amber-500 transition shadow-lg"
      >
        <Gift className="mx-auto mb-2 text-white" />
        <span className="text-sm font-medium text-white">
          {t.claimBonus ?? "Claim Bonus"}
        </span>
      </Link>
    </section>
  );
}