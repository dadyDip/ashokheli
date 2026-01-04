"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../../../components/SocketProvider";
import { LudoGameProvider } from "@/context/GameContext";
import LudoBoard from "../../../../components/LudoBoard";

export default function LudoRoom({ params }) {
  const { roomId } = params;
  const router = useRouter();
  const { socket, ready } = useSocket();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [entryFee, setEntryFee] = useState(0);
  const [canJoin, setCanJoin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const isDemoRoom = roomId.startsWith("demo-");

  // authoritative room state
  const [room, setRoom] = useState(null);
  const [waitingAction, setWaitingAction] = useState(false);

  const [lastMove, setLastMove] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  

  /* ================= AUTH ================= */
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");

    if (!t || !u) {
      router.replace("/login");
      return;
    }

    setToken(t);
    setUser(JSON.parse(u));

    let pid = localStorage.getItem("ludoPlayerId");
    if (!pid) {
      pid = "p-" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem("ludoPlayerId", pid);
    }
    setPlayerId(pid);
  }, [router]);

  /* ================= FETCH ROOM & CHECK BALANCE ================= */
  useEffect(() => {
    if (!roomId) return;

    // ✅ DEMO ROOM → SKIP DB COMPLETELY
    if (isDemoRoom) {
      setEntryFee(0);
      setCanJoin(true);
      return;
    }

    // 🔒 REAL ROOM → FETCH FROM DB
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "GET", roomId }),
        });

        if (!res.ok) throw new Error("Room not found");

        const data = await res.json();
        if (cancelled) return;

        setEntryFee(data.entryFee || 0);

        if (data.entryFee > 0) {
          const walletRes = await fetch("/api/wallet/summary", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const wallet = await walletRes.json();
          if (wallet.balance < data.entryFee) {
            alert("❌ Insufficient balance");
            router.push("/");
            return;
          }
        }

        setCanJoin(true);
      } catch (err) {
        console.error("❌ Room fetch failed", err);
        router.push("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, roomId]);



  /* ================= JOIN / RECONNECT ================= */
  
  useEffect(() => {
    if (!socket || !ready || !user || !playerId || !canJoin) return;

    socket.emit("join-ludo-room", {
      roomId,
      playerId,
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      maxPlayers: 4,
      entryFee,
      validated: true,
      demo: isDemoRoom,
    });
  }, [socket, ready, user, playerId, roomId, canJoin, entryFee, isDemo]);


  /* ================= SERVER EVENTS ================= */
  useEffect(() => {
    if (!socket) return;

    const onUpdateRoom = (serverRoom) => {
      setRoom(serverRoom);
      setWaitingAction(false);
    };

    const onAnimateMove = (payload) => {
      setLastMove(payload);

      const who =
        payload.playerId === playerId ? "You" : payload.playerId;

      const text =
        payload.dice != null
          ? `${who} moved piece ${payload.pieceIndex} by ${payload.dice}`
          : `${who} moved piece ${payload.pieceIndex}`;

      setNotice(text);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), 2200);

      setWaitingAction(false);
    };

    const onPlayerWon = ({ color }) => {
      alert(`${color.toUpperCase()} won the game!`);
    };

    socket.on("update-room", onUpdateRoom);
    socket.on("animate-move", onAnimateMove);
    socket.on("player-won", onPlayerWon);

    return () => {
      socket.off("update-room", onUpdateRoom);
      socket.off("animate-move", onAnimateMove);
      socket.off("player-won", onPlayerWon);
      clearTimeout(noticeTimer.current);
    };
  }, [socket, playerId]);

  /* ================= ACTIONS ================= */
  const rollDice = () => {
    if (!room || room.turn !== playerId) return;

    socket.emit("roll-dice", {
      roomId,
      playerId,
    });
  };

  const movePiece = (index) => {
    if (!room || waitingAction) return;
    if (room.turn !== playerId) return;

    setWaitingAction(true);
    socket.emit("move-piece", {
      roomId,
      playerId,
      pieceIndex: index,
    });
  };
  

  /* ================= DERIVED ================= */
  const playersData = room?.playersData || {};
  const order = room?.order || [];
  const phase = room?.phase || "waiting";
  const currentTurn = room?.turn || null;
  const dice = room?.dice ?? null;
  const winningAmount = room?.winningAmount ?? 0;


  const mappedPieces = {};
  Object.values(playersData).forEach((p) => {
    if (!p?.color || !Array.isArray(p.pieces)) return;
    mappedPieces[p.color] = {
      color: p.color,
      pieces: p.pieces.slice(),
      playerId: p.playerId,
    };
  });

  const maxPlayers = room?.maxPlayers || order.length;
  const playerCount = order.length;

  /* ================= UI ================= */
  return (
    <LudoGameProvider roomId={roomId} initialRoom={room}>
      <LudoBoard
        phase={phase}
        roomId={roomId}
        playerId={playerId}
        playersData={playersData}
        piecesData={mappedPieces}
        winningAmount={winningAmount} 
        currentPlayer={playersData[playerId]?.color || null}
        currentTurn={currentTurn}
        dice={dice}
        waitingAction={waitingAction}
        notice={notice}
        onRoll={rollDice}
        onMovePiece={movePiece}
        showWaiting={phase === "waiting"}
      />
    </LudoGameProvider>
  );
  
}
