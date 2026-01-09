"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";
import { CardGameProvider } from "@/context/GameContext";
import CardGameBoard from "@/components/CardGameBoard";
import { useSearchParams } from "next/navigation";


export default function RoomPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "callbreak";
  const { roomId } = useParams();
  const router = useRouter();
  const { socket, ready } = useSocket();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= SOCKET ERRORS ================= */
  useEffect(() => {
    if (!socket || !ready) return;

    const onJoinError = (msg) => {
      alert(msg);
      router.replace("/");
    };

    socket.on("join-error", onJoinError);
    return () => socket.off("join-error", onJoinError);
  }, [socket, ready, router]);

  /* ================= AUTH ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    function setVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);


  /* ================= ROOM FETCH (API ONLY) ================= */
  useEffect(() => {
    if (!token) return;

    const checkRoom = async () => {
      try {
        if (searchParams.get("demo") === "1") {
          setLoading(false);
          return;
        }
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "GET",
            roomId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "ROOM_FETCH_FAILED");

        if (data.entryFee > 0) {
          const walletRes = await fetch("/api/wallet/summary", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const wallet = await walletRes.json();

          if (!walletRes.ok || wallet.balance < data.entryFee) {
            alert("❌ Insufficient balance");
            router.push("/");
            return;
          }
        }

        setRoom(data);      // informational only
        setLoading(false);
      } catch (err) {
        console.error("Room check error:", err);
        alert("Failed to join room");
        router.push("/");
      }
    };

    checkRoom();
  }, [token, roomId, router]);

  if (loading) return <div>Loading room…</div>;
  if (!user) return null; // ✅ DO NOT BLOCK ON room

  return (
    <CardGameProvider
      roomId={roomId}
      mode={mode}              
      entryFee={room?.entryFee ?? 0}
      userId={user.id}
      name={`${user.firstName} ${user.lastName}`}
      demo={searchParams.get("demo") === "1"} 
    >
      <CardGameBoard />
    </CardGameProvider>
  );
}
