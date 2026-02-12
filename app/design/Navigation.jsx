"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Gift } from "lucide-react";
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
              fontFamily: "'Story Script', cursive",
              whiteSpace: "nowrap",
            }}
          >
            <span
              className="royals-gold"
              style={{
                color: "#FFD700",
                textShadow: "0 0 15px rgba(255, 215, 0, 0.4)",
                filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))",
                animation: "shinePulse 4s ease-in-out infinite"
              }}
            >
              Royals
            </span>
            <span
              className="bet-red"
              style={{
                color: "#FF0000",
                textShadow: "0 0 15px rgba(255, 0, 0, 0.4)",
                filter: "drop-shadow(0 0 8px rgba(255, 0, 0, 0.3))",
                animation: "shinePulse 4s ease-in-out infinite"
              }}
            >
              Bet
            </span>
          </h1>
        </div>

          {/* ================= LOGGED-IN USER UI ================= */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => {
                  changeLang(lang === "en" ? "bn" : "en");
                  setTimeout(() => {
                    window.location.reload();
                  }, 50);
                }}
                className="flex items-center gap-0.5 rounded-full bg-white/5 hover:bg-white/10 transition text-xs sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1"
                style={{ border: "1.5px solid #B153D7" }}
              >
                <span 
                  className={lang === "en" ? "font-bold text-white text-xs sm:text-sm" : "opacity-60 text-white text-xs sm:text-sm"}
                >
                  EN
                </span>
                <span className="opacity-50 text-white mx-0.5">|</span>
                <span 
                  className={lang === "bn" ? "font-bold text-white text-xs sm:text-sm" : "opacity-60 text-white text-xs sm:text-sm"}
                >
                  {isDesktop ? "বাংলা" : "বাংলা"}
                </span>
              </button>

              {/* Wallet Button */}
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition group min-w-[80px] sm:min-w-[90px]"
                style={{ border: "1.5px solid #B153D7" }}
              >
                <Wallet 
                  className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-colors group-hover:scale-110" 
                  style={{ color: "#6E026F" }}
                />
                <span 
                  className="font-medium text-sm sm:text-base text-white truncate"
                >
                  ৳ {balance}
                </span>
              </button>

              {/* Desktop Greeting */}
              {isDesktop && (
                <span className="text-sm text-white/80 hidden md:block">
                  Hello,{" "}
                  <span 
                    className="font-semibold"
                    style={{ color: "#B153D7" }}
                  >
                    {user.firstName}
                  </span>
                </span>
              )}

              {/* Profile Button */}
              <div className="relative">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 flex items-center justify-center rounded-full overflow-hidden hover:ring-2 hover:ring-purple-500/30 transition"
                  style={{ border: "1.5px solid #B153D7" }}
                  title="Dashboard"
                >
                  <img
                    src="/p-av.jpeg"
                    alt="Profile"
                    className="h-full w-full object-cover scale-105"
                  />
                </button>
                
                {/* Red notification dot */}
                <div className="absolute top-[-2px] right-[-2px] h-3 w-3 sm:h-3.5 sm:w-3.5 bg-red-500 rounded-full border border-black z-10 shadow-lg"></div>
              </div>
            </div>
          ) : (
            /* ================= GUEST UI (PERFECT BANGLA LAYOUT) ================= */
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* BONUS TEXT (Where wallet normally goes) */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 animate-pulse">
                <Gift className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent whitespace-nowrap">
                  প্রথম ডিপোজিটে ৫০% বোনাস!
                </span>
              </div>
              
              {/* Mobile Bonus (Smaller) */}
              <div className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 animate-pulse">
                <Gift className="h-3 w-3 text-yellow-400" />
                <span className="text-xs font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent whitespace-nowrap">
                  ৫০% বোনাস
                </span>
              </div>

              {/* Language Toggle (Same as logged-in) */}
              <button
                onClick={() => {
                  changeLang(lang === "en" ? "bn" : "en");
                  setTimeout(() => {
                    window.location.reload();
                  }, 50);
                }}
                className="hidden sm:flex items-center gap-0.5 rounded-full bg-white/5 hover:bg-white/10 transition text-sm px-2 py-1 md:px-3 md:py-1"
                style={{ border: "1.5px solid #B153D7" }}
              >
                <span 
                  className={lang === "en" ? "font-bold text-white text-sm" : "opacity-60 text-white text-sm"}
                >
                  EN
                </span>
                <span className="opacity-50 text-white mx-0.5">|</span>
                <span 
                  className={lang === "bn" ? "font-bold text-white text-sm" : "opacity-60 text-white text-sm"}
                >
                  বাংলা
                </span>
              </button>

              {/* Buttons Row */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Login Button */}
                <Button
                  variant="outline"
                  className="border-white/20 hover:border-white/30 transition-all duration-300 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 rounded-full hover:scale-105"
                  style={{ 
                    color: "white",
                    borderColor: "#B153D7",
                    backgroundColor: "rgba(177, 83, 215, 0.15)",
                    boxShadow: "0 0 10px rgba(177, 83, 215, 0.3)",
                    minWidth: "60px"
                  }}
                  onClick={() => router.push("/login")}
                >
                  লগইন
                </Button>

                {/* Register Button */}
                <Button
                  className="transition-all duration-300 hover:opacity-90 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 rounded-full hover:scale-105 relative overflow-hidden group"
                  style={{ 
                    background: "linear-gradient(45deg, #6E026F, #B153D7, #FF6B9D)",
                    backgroundSize: "200% 200%",
                    color: "white",
                    minWidth: "70px",
                    boxShadow: "0 0 15px rgba(177, 83, 215, 0.4)",
                    animation: "gradient-shift 3s ease infinite"
                  }}
                  onClick={() => router.push("/register")}
                >
                  {/* Button glow effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  
                  {/* Button text */}
                  <span className="relative font-bold">
                    <span className="hidden sm:inline">রেজিস্টার</span>
                    <span className="sm:hidden">রেজি</span>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <InstallBanner />
      
      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 10px rgba(177, 83, 215, 0.3);
          }
          50% { 
            opacity: 0.8;
            box-shadow: 0 0 20px rgba(177, 83, 215, 0.5);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}