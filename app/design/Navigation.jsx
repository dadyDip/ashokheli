"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "./ui/button";

import { useIsGameRoute } from "@/components/hooks/useIsGameRoute";
import { useIsDesktop } from "@/components/hooks/useIsDesktop";
import { useAuth } from "@/components/AuthProvider";
import InstallBanner from "@/components/InstallBanner";
import { useLang } from "@/app/i18n/useLang";

export function Navigation() {
  const router = useRouter();
  const isGameRoute = useIsGameRoute();
  const isDesktop = useIsDesktop();

  const { user, loading } = useAuth();
  const [balance, setBalance] = useState(0);
  const { lang, changeLang } = useLang();

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
        setBalance(Math.floor((data?.balance ?? 0) / 100));
      } catch (err) {
        console.error("Failed to load wallet summary", err);
      }
    };

    fetchBalance();
  }, [user]);

  if (isGameRoute || loading) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-transparent backdrop-blur supports-[backdrop-filter]:bg-purple-950/5">
        {/* Subtle purple tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-purple-800/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          {/* LEFT: LOGO */}
          <div
            onClick={() => router.push("/")}
            className="cursor-pointer select-none relative group"
          >
            <h1
              className="relative text-3xl sm:text-5xl font-bold tracking-tight"
              style={{
                color: "#B153D7",
                textShadow: "0 0 15px rgba(177, 83, 215, 0.4)",
                fontFamily: "'Story Script', cursive",
                whiteSpace: "nowrap",
                filter: "drop-shadow(0 0 8px rgba(177, 83, 215, 0.3))"
              }}
            >
              AshoKheli
            </h1>
          </div>

          {/* ================= LOGGED-IN USER UI ================= */}
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => {
                  changeLang(lang === "en" ? "bn" : "en");
                  setTimeout(() => {
                    window.location.reload();
                  }, 50);
                }}
                className="flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 transition text-sm px-2 py-0.5 sm:px-3 sm:py-1"
                style={{ border: "2px solid #B153D7" }}
              >
                <span 
                  className={lang === "en" ? "font-bold text-white" : "opacity-60 text-white"}
                >
                  EN
                </span>
                <span className="opacity-50 text-white">|</span>
                <span 
                  className={lang === "bn" ? "font-bold text-white" : "opacity-60 text-white"}
                >
                  বাংলা
                </span>
              </button>

              {/* Wallet Button - Responsive */}
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition group"
                style={{ border: "2px solid #B153D7" }}
              >
                <Wallet 
                  className="h-4 w-4 sm:h-5 sm:w-5 transition-colors group-hover:scale-110" 
                  style={{ color: "#6E026F" }}
                />
                <span 
                  className="font-medium text-sm sm:text-base text-white"
                >
                  ৳ {balance}
                </span>
              </button>

              {/* Desktop Greeting */}
              {isDesktop && (
                <span className="text-sm text-white/80">
                  Hello,{" "}
                  <span 
                    className="font-semibold"
                    style={{ color: "#B153D7" }}
                  >
                    {user.firstName}
                  </span>
                </span>
              )}

                {/* Profile Button with Notification */}
                <div className="relative">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-full overflow-hidden hover:ring-2 hover:ring-purple-500/30 transition"
                    style={{ border: "2px solid #B153D7" }}
                    title="Dashboard"
                  >
                    <img
                      src="/p-av.jpeg"
                      alt="Profile"
                      className="h-full w-full object-cover scale-105"
                    />
                  </button>
                  
                  {/* Red notification dot - positioned outside on parent container */}
                  <div className="absolute top-[-3px] right-[-3px] h-4 w-4 bg-red-500 rounded-full border-2 border-black z-10 shadow-lg"></div>
                </div>
            </div>
          ) : (
            /* ================= GUEST UI ================= */
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white/20 hover:border-white/30 transition"
                onClick={() => router.push("/login")}
                style={{ 
                  color: "#6E026F",
                  borderColor: "rgba(110, 2, 111, 0.3)"
                }}
              >
                Login
              </Button>

              <Button
                className="transition hover:opacity-90"
                onClick={() => router.push("/register")}
                style={{ 
                  backgroundColor: "#6E026F",
                  color: "white"
                }}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </nav>
      <InstallBanner />
    </>
  );
}