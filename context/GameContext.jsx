"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSocket } from "@/components/SocketProvider";
import { v4 as uuidv4 } from "uuid";

/* =========================================================
   🎴 CARD GAME CONTEXT (UNCHANGED)
========================================================= */

const CardGameContext = createContext(null);

export function CardGameProvider(props = {}) {
  const {
    roomId,
    name,
    entryFee = 0,
    userId,
    children,
    demo = false,
    mode,
  } = props;

  const { socket, ready: socketReady } = useSocket();

  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [joined, setJoined] = useState(false);



  const realPlayerCount =
    room?.playersData
      ? Object.values(room.playersData).filter(p => !p.isAI).length
      : 0;

  const winningAmount =
    entryFee > 0 ? entryFee * realPlayerCount : 0;


  /* ================= PLAYER ID ================= */
  useEffect(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid = "player-" + uuidv4().slice(0, 8);
      localStorage.setItem("playerId", pid);
    }
    setPlayerId(pid);
  }, []);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    if (!socket || !socketReady) return;

    const handleUpdate = (data) => {
      setRoom(data);
    };

    const handleRoomClosed = () => {
      setJoined(false);
      setRoom(null);
    };

    const handleDisconnect = () => {
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

  /* ================= JOIN ROOM ================= */
  useEffect(() => {
    if (!socket || !socketReady) return;
    if (!playerId || !roomId || !userId) return;
    if (joined) return;

    socket.emit("join-card-room", {
      roomId,
      playerId,
      userId,
      name,
      entryFee,
      validated: true,
      demo,
      mode,
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
    <CardGameContext.Provider
      value={{
        room,
        roomId,
        playerId,
        userId,
        socket,
        joined,
        socketReady,
        mode,
        winningAmount,
      }}
    >
      {children}
    </CardGameContext.Provider>
  );
}

export function useCardGame() {
  const ctx = useContext(CardGameContext);
  if (!ctx) {
    throw new Error("useCardGame must be used inside CardGameProvider");
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