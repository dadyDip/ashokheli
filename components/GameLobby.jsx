"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GameLobby({ player }) {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const id = "room-" + Math.random().toString(36).substring(2, 8);
    router.push(`/game/${id}`);
  };

  const joinRoom = () => {
    if (!roomId) return alert("Enter a room ID!");
    router.push(`/game/${roomId}`);
  };

  return (
    <div>
      <h3>Game Lobby</h3>
      <button onClick={createRoom}>Create Room</button>
      <input
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}
