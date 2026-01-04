"use client";

import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Users } from "lucide-react";

export function LudoRoomCard({
  gameImage,
  playerCount,
  maxPlayers,
  amount,
  winAmount,
}) {
  return (
    <Card className="group overflow-hidden bg-gray-900/40 border border-emerald-500/20 hover:shadow-lg transition-shadow">
      {gameImage && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={gameImage}
            alt="Ludo room"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
        </div>
      )}

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-emerald-300">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">
            {playerCount}/{maxPlayers}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge className="text-xs bg-gray-800/50 text-gray-300 border border-emerald-500/30">
            Amount: {amount}
          </Badge>
          <Badge className="text-xs bg-emerald-900/30 text-emerald-300 border border-emerald-500/40">
            Win: {winAmount}
          </Badge>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
          Join
        </Button>
      </CardFooter>
    </Card>
  );
}
