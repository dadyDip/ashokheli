"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsGameRoute } from "@/components/hooks/useIsGameRoute";
import { useIsDesktop } from "@/components/hooks/useIsDesktop";
import { useAuth } from "@/components/AuthProvider";
import {
  House,
  Gamepad2,
  Info,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5rem" : "16rem"
    );
  }, [collapsed]);

  // Base menu items for everyone
  const baseMenuItems = [
    { icon: House, label: "Home", path: "/" },
    { icon: Gamepad2, label: "Casino", path: "/casino" },
    { icon: Info, label: "About", path: "/about" },
    { icon: DollarSign, label: "Bonus", path: "/share" },
  ];

  // Sub-agent specific menu item (only if user is sub-agent)
  const subAgentMenuItem = user?.role === "sub-agent" 
    ? [{ icon: User, label: "Agent Dashboard", path: "/subagent/dashboard" }]
    : [];

  // Combine menu items
  const menuItems = [...baseMenuItems, ...subAgentMenuItem];

  const isGameRoute = useIsGameRoute();
  const isDesktop = useIsDesktop();

  if (isGameRoute && !isDesktop) return null;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)]
        w-[var(--sidebar-width)]
        flex-col border-r border-purple-500/30
        bg-black/90 backdrop-blur
        transition-all duration-300 z-40"
      >
        {/* Sidebar neon border */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-gradient-to-b from-purple-500/0 via-pink-500 to-purple-500/0" />
        
        {/* COLLAPSE BUTTON with neon glow */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6
          bg-black border-2 border-purple-500/60
          rounded-full p-1.5 text-purple-300
          hover:bg-purple-950/50 hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]
          transition-all duration-300 z-50"
        >
          {collapsed ? <ChevronRight size={18} className="drop-shadow-[0_0_6px_rgba(192,38,211,0.8)]" /> : <ChevronLeft size={18} className="drop-shadow-[0_0_6px_rgba(192,38,211,0.8)]" />}
        </button>

        <nav className="flex flex-col gap-2 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isSubAgentItem = item.label === "Agent Dashboard";

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-300
                ${
                  isActive
                    ? isSubAgentItem
                      ? "text-orange-300 bg-orange-950/30"
                      : "text-purple-300 bg-purple-950/30"
                    : isSubAgentItem
                    ? "text-orange-400 hover:text-orange-300 hover:bg-orange-950/20"
                    : "text-gray-400 hover:text-purple-300 hover:bg-purple-950/20"
                }`}
              >
                {/* Active neon indicator */}
                {isActive && (
                  <span className={`absolute left-0 top-0 h-full w-1 rounded-r shadow-[0_0_10px]
                    ${isSubAgentItem 
                      ? "bg-gradient-to-b from-orange-500 to-yellow-500 shadow-orange-500/70" 
                      : "bg-gradient-to-b from-purple-500 to-pink-500 shadow-purple-500/70"
                    }`} 
                  />
                )}

                {/* Icon with conditional neon glow */}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-all duration-300
                    ${isActive 
                      ? isSubAgentItem
                        ? "text-orange-300 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]"
                        : "text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                      : isSubAgentItem
                      ? "group-hover:text-orange-200 group-hover:drop-shadow-[0_0_8px_rgba(234,88,12,0.6)]"
                      : "group-hover:text-purple-200 group-hover:drop-shadow-[0_0_8px_rgba(192,38,211,0.6)]"
                    }
                    ${item.label === "Casino"
                      ? "text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]"
                      : item.label === "Bonus"
                      ? "text-yellow-400 group-hover:text-yellow-300"
                      : ""
                    }
                  `}
                />
                
                {/* Label with neon text effect */}
                {!collapsed && (
                  <span className={`text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? isSubAgentItem
                        ? "bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
                      : isSubAgentItem
                      ? "group-hover:bg-gradient-to-r group-hover:from-orange-200 group-hover:to-yellow-200 group-hover:bg-clip-text group-hover:text-transparent"
                      : "group-hover:bg-gradient-to-r group-hover:from-purple-200 group-hover:to-pink-200 group-hover:bg-clip-text group-hover:text-transparent"
                    }
                    ${item.label === "Bonus" && isActive
                      ? "bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
                      : ""
                    }
                  `}
                  >
                    {item.label}
                  </span>
                )}
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300
                  ${isActive ? "opacity-5" : ""}
                  ${isSubAgentItem
                    ? "bg-gradient-to-r from-orange-500/0 via-yellow-500/0 to-orange-500/0"
                    : "bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0"
                  }`} />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50
        border-t border-purple-500/40
        bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/90">
        {/* Top neon border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-pink-500 to-purple-500/0" />
        
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isSubAgentItem = item.label === "Agent Dashboard";

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`relative flex flex-col items-center gap-1 text-xs py-1 transition-all duration-300
                ${
                  isActive
                    ? isSubAgentItem
                      ? "text-orange-400"
                      : "text-purple-400"
                    : isSubAgentItem
                    ? "text-orange-500 hover:text-orange-400"
                    : "text-gray-400 hover:text-purple-300"
                }`}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full shadow-[0_0_10px]
                    ${isSubAgentItem
                      ? "bg-gradient-to-r from-orange-500 to-yellow-500 shadow-orange-500/70"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/70"
                    }`} 
                  />
                )}
                
                {/* Icon container */}
                <div className={`relative p-1.5 rounded-lg transition-all duration-300
                  ${isActive 
                    ? isSubAgentItem
                      ? "bg-orange-950/50 shadow-inner shadow-orange-500/30"
                      : "bg-purple-950/50 shadow-inner shadow-purple-500/30"
                    : isSubAgentItem
                    ? "group-hover:bg-orange-950/30"
                    : "group-hover:bg-purple-950/30"
                  }
                  ${item.label === "Bonus" && isActive
                    ? "bg-gradient-to-br from-yellow-900/50 to-orange-900/30"
                    : ""
                  }
                `}>
                  <Icon className={`h-5 w-5 transition-all duration-300
                    ${isActive 
                      ? isSubAgentItem
                        ? "text-orange-300 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]"
                        : "text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                      : isSubAgentItem
                      ? "group-hover:text-orange-200 group-hover:drop-shadow-[0_0_6px_rgba(234,88,12,0.6)]"
                      : "group-hover:text-purple-200 group-hover:drop-shadow-[0_0_6px_rgba(192,38,211,0.6)]"
                    }
                    ${item.label === "Casino" && isActive
                      ? "text-pink-300 drop-shadow-[0_0_15px_rgba(236,72,153,0.9)]"
                      : item.label === "Bonus" && isActive
                      ? "text-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                      : item.label === "Bonus"
                      ? "text-yellow-400 group-hover:text-yellow-300"
                      : ""
                    }
                  `} />
                </div>
                
                {/* Label with neon effect for active */}
                <span className={`font-medium transition-all duration-300
                  ${isActive 
                    ? isSubAgentItem
                      ? "bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
                    : ""
                  }
                  ${item.label === "Bonus" && isActive
                    ? "bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
                    : ""
                  }
                `}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}