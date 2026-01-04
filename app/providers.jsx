// Providers.jsx
"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { SocketProvider } from "@/components/SocketProvider";
import { usePathname } from "next/navigation";
import { Navigation } from "./design/Navigation";
import { Sidebar } from "./design/Sidebar";

export function Providers({ children }) {
  const pathname = usePathname();
  const isGamePage = pathname.startsWith("/game");
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <AuthProvider>
      <SocketProvider>
        {!isGamePage && <Navigation />}
        {!isGamePage && <Sidebar />}

        <main
          className={`
            relative
            min-h-screen
            pb-16
            transition-all duration-300
            ${!isGamePage && !isDashboard ? "lg:ml-[var(--sidebar-width)]" : ""}
          `}
        >
          {children}
        </main>
      </SocketProvider>
    </AuthProvider>
  );
}
