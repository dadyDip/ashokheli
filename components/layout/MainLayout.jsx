"use client";

import { Sidebar } from "@/app/design/Sidebar";
import { Navigation } from "@/app/design/Navigation";
import { usePathname } from "next/navigation";

export function MainLayout({ children }) {
  const pathname = usePathname();

  // Pages where sidebar/navbar should be hidden
  const isGamePage = pathname.startsWith("/game");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white">
      {!isGamePage && <Navigation />}
      {!isGamePage && <Sidebar />}

       <main
        className={`
            relative
            transition-all duration-300
            ${!isGamePage ? "lg:ml-64" : ""}
            px-4 py-10
        `}
        >
        {children}
      </main>
    </div>
  );
}
