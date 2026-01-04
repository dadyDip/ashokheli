"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TransactionList } from "@/components/dashboard/TransactionList";


export default function DashboardPage() {
  const router = useRouter();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    Promise.all([
      fetch("/api/wallet/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([summaryData, txData]) => {
        if (summaryData.error) {
          router.replace("/login");
          return;
        }

        setSummary(summaryData);
        setTransactions(txData);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-white/60">
        Loading dashboard…
      </div>
    );
  }

  return (
    <main className="pb-20 lg:ml-[var(--sidebar-width)] px-4 py-8 space-y-10">
      <BalanceCard data={summary} />
      <QuickActions />
      <StatsGrid stats={summary} />
      <TransactionList transactions={transactions} />

      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }}
        className="w-full mt-12 py-3 rounded-xl border border-red-500/30
                   text-red-400 hover:bg-red-500/10"
      >
        Logout
      </button>
    </main>
  );
}
