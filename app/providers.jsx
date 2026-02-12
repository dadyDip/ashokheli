// Providers.jsx
"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { SocketProvider } from "@/components/SocketProvider";
import { usePathname } from "next/navigation";
import { Navigation } from "./design/Navigation";
import { Sidebar } from "./design/Sidebar";
import { useEffect } from "react";

export function Providers({ children }) {
  const pathname = usePathname();
  
  // Check if we're on game-related pages where layout should be hidden
  const isGamePage = pathname.startsWith("/game") || 
                     pathname.startsWith("/casino/play") ||
                     pathname.startsWith("/casino/launch-game") ||
                     pathname.startsWith("/casino/game-wrapper") ||
                     pathname.startsWith("/casino/return-game");

  const isDashboard = pathname.startsWith("/dashboard");
  const isDepositPage = pathname === "/dashboard/deposit" || pathname?.includes("/dashboard/deposit");

  // Check if we're on external casino provider pages (optional, if you want to hide there too)
  const isExternalCasinoPage = () => {
    if (typeof window === 'undefined') return false;
    
    try {
      const currentUrl = window.location.href;
      const externalDomains = [
        'cdnet-launch.apac.spribegaming.com',
        'igamingapis.com',
        'softapi2.shop',
        'jili-games.com',
        'spribe-games.com',
        'pgsoft-games.com',
        'evolution-live.com',
        'wbgame.cmz56k3w.com' // Add this JILI game domain
      ];
      
      return externalDomains.some(domain => currentUrl.includes(domain));
    } catch {
      return false;
    }
  };

  // Hide layout on game pages and external casino pages
  const hideLayout = isGamePage;

  return (
    <AuthProvider>
      <SocketProvider>
        {!hideLayout && <Navigation />}
        {!hideLayout && <Sidebar />}

        <main
          className={`
            relative
            min-h-screen
            pb-16
            transition-all duration-300
            ${!hideLayout && !isDashboard ? "lg:ml-[var(--sidebar-width)]" : ""}
            ${isDepositPage ? "deposit-page-main" : ""}
          `}
          style={{
            '--sidebar-width': '16rem'
          }}
        >
          {children}
        </main>

        {/* Fix for deposit page button getting cut off */}
        <style jsx global>{`
          @media (max-width: 1023px) {
            .deposit-page-main {
              padding-bottom: 80px !important;
              margin-bottom: 0 !important;
            }
            
            /* Ensure deposit modal content is scrollable */
            [data-radix-dialog-content] {
              max-height: 85vh !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Fix for floating add button on withdraw page */
            .fixed.right-6.bottom-24 {
              bottom: 90px !important;
              z-index: 60 !important;
            }
            
            /* Ensure all dashboard content has proper bottom spacing */
            .pt-24.pb-10 {
              padding-bottom: 40px !important;
            }
            
            /* Fix for submit buttons getting cut off */
            button.w-full.bg-red-600.text-white.py-4.rounded-xl {
              margin-bottom: 20px !important;
            }
            
            /* Add safe area for notched phones */
            @supports (padding-bottom: env(safe-area-inset-bottom)) {
              .deposit-page-main,
              .pt-24.pb-10,
              [data-radix-dialog-content] {
                padding-bottom: calc(env(safe-area-inset-bottom) + 20px) !important;
              }
            }
          }
        `}</style>
      </SocketProvider>
    </AuthProvider>
  );
}

export function PWAServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered", reg))
        .catch(console.error);
    }
  }, []);

  return null;
}