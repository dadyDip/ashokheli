
import SevenCallsBoard from "./SevenCallsBoard";
import CallBreakBoard from "./CallBreakBoard";
import { useCardGame } from "@/context/GameContext";

export default function CardGameBoard() {
  const { room, playerId, joined, mode } = useCardGame();


  if (!playerId) {
    return <div>⏳ Initializing player...</div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div>
          <p>🎮 Setting up game…</p>
          <p className="text-sm opacity-70">Waiting for server state</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mode === "seven" && <SevenCallsBoard />}
      {mode === "callbreak" && <CallBreakBoard />}
    </>
  );
}
