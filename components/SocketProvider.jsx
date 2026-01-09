"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://localhost:3000";

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on("connect", () => {
      setReady(true);
    });

    s.on("disconnect", (reason) => {
      console.warn("⚠️ SOCKET DISCONNECTED:", reason);
      setReady(false);
    });

    s.on("connect_error", (err) => {
      console.error("🔥 SOCKET CONNECT ERROR:", err.message);
      setReady(false);
    });

    s.on("error", (err) => {
      console.error("🔥 SOCKET ERROR:", err);
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setReady(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, ready }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    console.error("❌ useSocket must be used inside SocketProvider");
    return { socket: null, ready: false };
  }
  return ctx;
}