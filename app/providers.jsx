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
          `}
          style={{
            '--sidebar-width': '16rem'
          }}
        >
          {children}
        </main>
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