"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function useWalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0); // taka (UI only)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/wallet/summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();

        // 🔒 server → paisa → UI taka
        setBalance(Math.floor((data?.balance ?? 0) / 100));
      } catch (err) {
        console.error("Wallet fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  return { balance, loading };
}
