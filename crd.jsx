"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSocket } from "@/components/SocketProvider";

/* =========================================================
   🎴 CARD GAME CONTEXT (UNCHANGED)
========================================================= */

const CardGameContext = createContext(null);
export function CardGameProvider({ roomId, name, entryFee, userId, children }) {
  const { socket, ready: socketReady } = useSocket();

  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [joined, setJoined] = useState(false);

  /* ================= PLAYER ID ================= */
  useEffect(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid = "player-" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem("playerId", pid);
      console.log("🆕 [Player] generated:", pid);
    } else {
      console.log("🔁 [Player] loaded:", pid);
    }
    setPlayerId(pid);
  }, []);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    if (!socket || !socketReady) return;

    const handleUpdate = (data) => {
      console.log(
        "📥 [update-room]",
        "phase:", data.phase,
        "turn:", data.turn,
        "players:", Object.keys(data.playersData || {}).length
      );
      setRoom(data);
    };

    const handleRoomClosed = () => {
      console.log("🚪 Room closed by server");
      setJoined(false);
      setRoom(null);
    };

    const handleDisconnect = () => {
      console.log("🔴 socket disconnected → allow rejoin");
      setJoined(false);
    };

    socket.on("update-room", handleUpdate);
    socket.on("room-closed", handleRoomClosed);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("update-room", handleUpdate);
      socket.off("room-closed", handleRoomClosed);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, socketReady]);

  /* ================= JOIN ROOM (SAFE & RECONNECTABLE) ================= */
  useEffect(() => {
    if (!socket || !socketReady || !playerId || !roomId || !userId) return;
    if (joined) return;

    console.log("📡 JOINING ROOM", { roomId, playerId, userId, name });

    socket.emit("join-card-room", {
      roomId,
      playerId,
      userId,          // ✅ use prop
      name,
      entryFee,
      validated: true,
    });

    setJoined(true);
  }, [
    socket,
    socketReady,
    playerId,
    roomId,
    userId,
    name,
    entryFee,
    joined,
  ]);


  return (
    <GameContext.Provider
      value={{
        room,
        roomId,
        playerId,
        userId,        // ✅ expose to children
        socket,
        joined,
        socketReady,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useCardGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGameContext must be used inside GameProvider");
  }
  return ctx;
}



const LudoGameContext = createContext(null);

export function LudoGameProvider({ roomId, initialRoom, children }) {
  const { socket, ready } = useSocket();

  // ✅ Authoritative room state
  const [room, setRoom] = useState(initialRoom ?? null);

  // ✅ Winner info (from server events)
  const [winner, setWinner] = useState(null);

  // ✅ PlayerId comes from localStorage (created earlier)
  const [playerId, setPlayerId] = useState(null);

  /* ================= PLAYER ID ================= */
  useEffect(() => {
    const pid = localStorage.getItem("ludoPlayerId");
    if (pid) setPlayerId(pid);
  }, []);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    if (!socket || !ready) return;

    const handleUpdateRoom = (serverRoom) => {
      setRoom(serverRoom);
    };

    const handlePlayerWon = ({ playerId, color }) => {
      setWinner({ playerId, color });
    };

    socket.on("update-room", handleUpdateRoom);
    socket.on("player-won", handlePlayerWon);

    return () => {
      socket.off("update-room", handleUpdateRoom);
      socket.off("player-won", handlePlayerWon);
    };
  }, [socket, ready]);

  /* ================= DERIVED VALUES ================= */
  const entryFee = room?.entryFee ?? 0;
  const maxPlayers = room?.maxPlayers ?? 0;

  // Only count real players (not AI)
  const realPlayerCount =
    room?.playersData
      ? Object.values(room.playersData).filter(p => !p.isAI).length
      : 0;

  const winningAmount =
    entryFee > 0 ? entryFee * realPlayerCount : 0;

  /* ================= CONTEXT VALUE ================= */
  const value = {
    room,
    roomId,
    playerId,
    winner,
    entryFee,
    maxPlayers,
    winningAmount,
    socket,
  };

  return (
    <LudoGameContext.Provider value={value}>
      {children}
    </LudoGameContext.Provider>
  );
}

export function useLudoGame() {
  const ctx = useContext(LudoGameContext);
  if (!ctx) {
    throw new Error("useLudoGame must be used inside LudoGameProvider");
  }
  return ctx;
}