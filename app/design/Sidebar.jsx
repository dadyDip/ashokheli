"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsGameRoute } from "@/components/hooks/useIsGameRoute";
import { useIsDesktop } from "@/components/hooks/useIsDesktop";
import {
  House,
  BookOpen,
  Gamepad2,
  Map,
  Info,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  /* 🔑 CONTROL SIDEBAR WIDTH (DESKTOP ONLY) */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5rem" : "16rem"
    );
  }, [collapsed]);

  const menuItems = [
    { icon: House, label: "Home", path: "/" },
    { icon: Map, label: "Roadmap", path: "/roadmap" },
    { icon: Info, label: "About", path: "/about" },
    { icon: HelpCircle, label: "Share & Earn", path: "/share" },
  ];

  const isGameRoute = useIsGameRoute();
  const isDesktop = useIsDesktop();

  // ❌ Hide sidebar on mobile game screens
  if (isGameRoute && !isDesktop) return null;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)]
        w-[var(--sidebar-width)]
        flex-col border-r border-emerald-500/20
        bg-gray-900/80 backdrop-blur
        transition-all duration-300 z-40"
      >
        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6
          bg-gray-900 border border-emerald-500/30
          rounded-full p-1 text-emerald-300
          hover:bg-gray-800"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="flex flex-col gap-2 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 transition
                ${
                  isActive
                    ? "text-emerald-300"
                    : "text-gray-400 hover:text-emerald-300"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500 rounded-r" />
                )}

                <Icon className="h-5 w-5 shrink-0" />

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50
        border-t border-emerald-500/20
        bg-gray-900/95 backdrop-blur">
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1 text-xs
                ${
                  isActive
                    ? "text-emerald-400"
                    : "text-gray-400 hover:text-emerald-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
