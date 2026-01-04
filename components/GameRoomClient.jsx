"use client";
import { useEffect, useState } from "react";

export default function GameRoomClient({ roomId }) {
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("guestId") || localStorage.getItem("userId");
    setPlayerId(id);
  }, []);

  if (!playerId) return <p>Loading...</p>;

  return <p>Player {playerId} in room {roomId}</p>;
}
