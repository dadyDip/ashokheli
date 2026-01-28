"use client";

import { useRouter } from "next/navigation";
import { Flame, Dice5, Coins } from "lucide-react";

export default function CasinoGrid({ games }) {
  const router = useRouter();

  const gameIcons = {
    crash: Flame,
    dice: Dice5,
    slot: Coins,
  };

  const gameColors = {
    crash: "emerald",
    dice: "blue",
    slot: "purple",
  };

  const allGames = [
    ...games,
    { 
      id: "slot", 
      name: "Slot Machine",
      description: "Classic 3-reel slots"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 p-6">
      {allGames.map((game) => {
        const Icon = gameIcons[game.id] || Flame;
        const color = gameColors[game.id] || "emerald";
        
        return (
          <button
            key={game.id}
            onClick={() => router.push(`/casino/${game.id}`)}
            className={`group relative rounded-2xl overflow-hidden
              bg-gradient-to-br from-gray-900 to-gray-800
              border border-${color}-500/20
              hover:border-${color}-400
              transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100
              bg-${color}-500/20 blur-2xl transition`} />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-36 gap-2">
              <Icon className={`h-8 w-8 text-${color}-400 drop-shadow-[0_0_10px_rgba(var(--color-${color}-500),0.8)]`} />
              <span className="text-lg font-bold text-white">
                {game.name}
              </span>
              <span className={`text-xs text-${color}-300`}>
                Play Now
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}