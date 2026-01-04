"use client";
import { Providers } from "./providers";

export default function ClientLayout({ children }) {
  return <Providers>{children}</Providers>;
}
