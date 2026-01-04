"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, User } from "lucide-react";
import { Button } from "./ui/button";

import { useIsGameRoute } from "@/components/hooks/useIsGameRoute";
import { useIsDesktop } from "@/components/hooks/useIsDesktop";
import { useAuth } from "@/components/AuthProvider";


export function Navigation() {
  const router = useRouter();
  const isGameRoute = useIsGameRoute();
  const isDesktop = useIsDesktop();

  const { user, loading } = useAuth();
  const [balance, setBalance] = useState(0); // TAKA (UI only)

  useEffect(() => {
    if (!user) {
      setBalance(0);
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

        // paisa → taka (safe)
        setBalance(Math.floor((data?.balance ?? 0) / 100));
      } catch (err) {
        console.error("Failed to load wallet summary", err);
      }
    };

    fetchBalance();
  }, [user]);

  // Hide navbar on game routes or while auth loads
  if (isGameRoute || loading) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-gray-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* LEFT: LOGO */}
        <div
          onClick={() => router.push("/")}
          className="cursor-pointer select-none"
        >
        <h1
          className="
            antialiased
            font-semibold
            tracking-wide
            text-3xl sm:text-5xl
            leading-[1.35]
            px-1
            bg-gradient-to-r from-emerald-500 to-teal-500
            bg-clip-text text-transparent
          "
          style={{
            fontFamily: "'Story Script', cursive",
            whiteSpace: "nowrap",
          }}
        >
          AshoKheli
        </h1>
        </div>

        {/* ================= LOGGED-IN USER UI ================= */}
        {user ? (
          <>
            {/* CENTER: WALLET */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-300">
                Demo
              </span>

              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-emerald-500/10 border border-emerald-500/30
                          text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Wallet className="h-4 w-4" />
                <span className="font-medium">৳ {balance}</span>
              </button>
            </div>
            {/* RIGHT: HELLO + PROFILE */}
            <div className="flex items-center gap-4">
              {isDesktop && (
                <span className="text-sm text-white/80">
                  Hello,{" "}
                  <span className="font-semibold text-white">
                    {user.firstName}
                  </span>
                </span>
              )}

              <button
                onClick={() => router.push("/dashboard")}
                className="h-9 w-9 flex items-center justify-center rounded-full
                           border border-emerald-500/30 text-emerald-300
                           hover:bg-emerald-500/10 transition"
                title="Dashboard"
              >
                <User className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          /* ================= GUEST UI ================= */
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-emerald-500/30 text-emerald-300"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push("/register")}
            >
              Register
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
