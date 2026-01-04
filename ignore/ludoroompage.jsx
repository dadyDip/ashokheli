"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSocket } from "../../../../components/SocketProvider"; // Correct import path
import LudoBoard from "../../../../components/LudoBoard";
import Dice from "../../../../components/Dice";

export default function LudoRoom({ params }) {
  const { roomId } = params;
  const searchParams = useSearchParams();
  const maxPlayers = Number(searchParams.get("maxPlayers")) || 4;

  const socket = useSocket(); // Get socket from provider
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [pieces, setPieces] = useState({});
  const [dice, setDice] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Set playerId and join room
  useEffect(() => {
    if (!socket) return; // Wait until socket is initialized

    const id =
      localStorage.getItem("guestId") ||
      "guest-" + Math.floor(Math.random() * 1000);
    localStorage.setItem("guestId", id);
    setPlayerId(id);

    // Emit join-ludo-room
    socket.emit("join-ludo-room", { roomId, playerId: id, maxPlayers });
  }, [socket, roomId]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleExisting = (existing) => setPlayers(existing.concat(playerId));
    const handleJoined = (id) => setPlayers((prev) => [...prev, id]);
    const handleGameStarted = (room) => {
      setGameStarted(true);
      setPlayers(room.players);
      setPieces(room.pieces);
      setCurrentTurn(room.players[room.turn]);
    };
    const handleDiceRolled = ({ playerId: pid, dice }) => setDice(dice);
    const handlePieceMoved = ({ playerId: pid, pieceIndex, newPosition, nextTurn }) => {
      setPieces((prev) => ({
        ...prev,
        [pid]: prev[pid].map((p, i) => (i === pieceIndex ? newPosition : p)),
      }));
      setCurrentTurn(nextTurn);
      setDice(null);
    };
    const handlePlayerLeft = (id) => setPlayers((prev) => prev.filter((p) => p !== id));

    socket.on("existing-players", handleExisting);
    socket.on("player-joined", handleJoined);
    socket.on("game-started", handleGameStarted);
    socket.on("dice-rolled", handleDiceRolled);
    socket.on("piece-moved", handlePieceMoved);
    socket.on("player-left", handlePlayerLeft);

    return () => {
      socket.off("existing-players", handleExisting);
      socket.off("player-joined", handleJoined);
      socket.off("game-started", handleGameStarted);
      socket.off("dice-rolled", handleDiceRolled);
      socket.off("piece-moved", handlePieceMoved);
      socket.off("player-left", handlePlayerLeft);
    };
  }, [socket, playerId]);

  // Emit dice roll
  const rollDice = () => {
    if (currentTurn !== playerId) return alert("Not your turn!");
    socket.emit("roll-dice");
  };

  // Emit move piece
  const movePiece = (index) => {
    if (currentTurn !== playerId) return alert("Not your turn!");
    socket.emit("move-piece", { pieceIndex: index });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "linear-gradient(135deg, #000000ff, #2c3d33ff, #354a5aff)",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Ludo Room: {roomId}</h1>
      <h3 style={{ textAlign: "center" }}>Player: {playerId}</h3>
      <h3 style={{ textAlign: "center" }}>Current Turn: {currentTurn || "Waiting..."}</h3>

      {!gameStarted && (
        <p style={{ textAlign: "center", fontSize: "1.2rem", marginTop: "2rem" }}>
          Waiting for all players to join ({players.length}/{maxPlayers})...
        </p>
      )}

      {gameStarted && (
        <>
          <LudoBoard pieces={pieces} currentPlayer={playerId} onMovePiece={movePiece} />
          <Dice
            value={dice}
            onRoll={rollDice}
            disabled={currentTurn !== playerId || dice !== null}
          />
        </>
      )}
    </div>
  );
}
