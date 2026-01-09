"use client";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";
import { HeroSection } from "./design/HeroSection";
import { GameRoomCard } from "./design/GameRoomCard";
import { LudoRoomCard } from "./design/LudoRoomCard";

export default function Home() {
  const router = useRouter();
  const { socket, ready: socketReady } = useSocket();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);


  // Ludo state
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomIdInput, setRoomIdInput] = useState("");

  // Card game state
  const [cardRoomInput, setCardRoomInput] = useState("");
  const [cardGameMode, setCardGameMode] = useState("callbreak");
  const [targetScore, setTargetScore] = useState(30);

  const startDemoCardGame = (mode, matchType = "per-lead") => {
    const demoRoomId = `demo-${mode}-${uuidv4().slice(0, 6)}`;

    socket.emit("create-demo-room", {
      roomId: demoRoomId,
      gameType: mode,
      matchType,          // ✅ THIS IS KEY
      targetScore: 30,
      maxRounds: matchType === "per-lead" ? 1 : null,
      bots: 3,
    });

    router.push(`/game/cards/${demoRoomId}?mode=${mode}&demo=1`);
  };



  const startDemoLudo = () => {
    const demoRoomId = `demo-ludo-${uuidv4().slice(0, 6)}`;
    router.push(`/game/ludo/${demoRoomId}?demo=1`);
  };


  // ================= INIT =================
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }

    let pid = localStorage.getItem("playerId");
    if (!pid) {
      const pid = "p-" + uuidv4().slice(0, 8);
      localStorage.setItem("playerId", pid);
    }
    setPlayerId(pid);
    setLoading(false);
  }, []);

  // ================= AUTH GUARD =================
  const requireAuth = (fn) => {
    if (!token || !user) {
      router.push("/login");
      return;
    }
    fn();
  };

  const createLudoRoom = async ({ maxPlayers, entryFee }) => {
    try {
      if (entryFee > 0 && user.balance < entryFee) {
        alert("❌ Not enough balance");
        return;
      }

      const res = await fetch("/api/ludo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxPlayers,
          entryFee: entryFee * 100,
          userId: user.id, // ✅ FIX
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to create room");
        return;
      }


      router.push(`/game/ludo/${data.roomId}`);
    } catch (err) {
      console.error(err);
      alert("Could not create Ludo room");
    }
  };

  const joinLudoRoom = () => {
    if (!roomIdInput) return;
    router.push(`/game/ludo/${roomIdInput}`);
  };

  // ===== CREATE CARD ROOM =====
  const createCardRoom = async ({ mode, matchType , targetScore, entryFee }) => {
    if (!socketReady || !socket) {
      alert("Game server not ready yet, please wait 1–2 seconds");
      return;
    }

    if (entryFee > 0 && user.balance < entryFee) {
      alert("❌ Not enough balance to create a paid room");
      return;
    }

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "CREATE",
        gameType: mode,
        matchType,
        targetScore,
        entryFee: Number(entryFee) * 100, // convert to paisa ONCE
        maxPlayers: 4,
      }),
    });


    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Failed to create room");
      return;
    }

    const roomId = data.roomId;

    // ✅ Navigate only
    router.push(`/game/cards/${roomId}?mode=${mode}`);
  };


  // ===== JOIN CARD ROOM =====
  const joinCardRoom = async () => {
    if (!cardRoomInput) {
      alert("Enter room ID");
      return;
    }
    if (!socketReady || !socket) {
      alert("Connecting to game server… please wait");
      return;
    }

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "JOIN",
        roomId: cardRoomInput,
      }),
    });


    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed to join room");
      return;
    }

    // Check balance for paid rooms
    const roomEntryFee = data.entryFee || 0;
    if (roomEntryFee > 0 && user.balance < roomEntryFee) {
      alert("❌ Not enough balance to join this paid room");
      router.push("/"); // redirect to home
      return;
    }

    router.push(`/game/cards/${cardRoomInput}?mode=${cardGameMode}`);
  };


  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white">
      <main>
        <HeroSection
          onCreateCard={(data) => requireAuth(() => createCardRoom(data))}
          onJoinCard={() => requireAuth(joinCardRoom)}
          onCreateLudoRoom={(data) =>
            requireAuth(() => createLudoRoom(data))
          }
          onJoinLudo={() => requireAuth(joinLudoRoom)}
          onSetLudoRoomId={setRoomIdInput}
        />

        <section className="max-w-6xl mx-auto mt-16 px-4">
          <h2 className="text-3xl font-bold mb-8 text-white">
            🎮 Public Free Rooms
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            {/* CALLBREAK DEMO */}
            <GameRoomCard
              title="CallBreak Practice"
              description="Play CallBreak with AI opponents. Free & unlimited."
              gameImage="/images/card-game.jpg"
              onJoin={() => requireAuth(() => startDemoCardGame("callbreak", "per-lead"))}
            />

            {/* SEVEN CALLS DEMO */}
            <GameRoomCard
              title="Seven Calls Practice"
              description="Practice Seven Calls against smart AI bots."
              gameImage="/images/sevencall-img-demo.jpg"
              onJoin={() => requireAuth(() => startDemoCardGame("seven", "per-lead"))}
            />

            {/* LUDO DEMO — 🔥 LUDO BACKGROUND */}
            <GameRoomCard
              title="Ludo Practice"
              description="Play Ludo with 3 AI players. No entry fee."
              gameImage="/images/ludo.jpg"
              onJoin={() => requireAuth(startDemoLudo)}
            />

          </div>
        </section>

      </main>
    </div>
  );
}
