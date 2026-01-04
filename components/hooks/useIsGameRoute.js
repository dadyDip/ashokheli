"use client";

import { usePathname } from "next/navigation";

export function useIsGameRoute() {
  const pathname = usePathname();
  return pathname.startsWith("/game/");
}
