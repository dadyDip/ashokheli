"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/design/ui/button";

export function CreateRoomModal({
  open,
  onClose,
  game,
  onCreate,
  userBalance,
}) {
  const [mode, setMode] = useState("");

  // 🆕 MATCH TYPE
  const [matchType, setMatchType] = useState("target"); // "target" | "per-lead"

  const [targetScore, setTargetScore] = useState(100);
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(50);

  if (!open) return null;

  const modes =
    game === "cards"
      ? [
          { label: "Call Break", value: "callbreak" },
          { label: "7 Cards (2v2)", value: "seven" },
        ]
      : [];

  const submit = async () => {
    if (!mode) {
      alert("Select game mode");
      return;
    }

    if (isPaid && entryFee < 10) {
      alert("Minimum entry fee is 10 TK");
      return;
    }

    if (isPaid && userBalance < entryFee) {
      alert("❌ Not enough balance to create this paid room");
      return;
    }

    await onCreate({
      mode,
      matchType, // ✅ SEND TO SERVER
      targetScore: matchType === "target" ? targetScore : null,
      entryFee: isPaid ? entryFee : 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 space-y-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60">
          <X />
        </button>

        <h2 className="text-xl font-bold text-white">Create Room</h2>

        {/* GAME MODE */}
        <div>
          <label className="text-sm text-white/70">Game Mode</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  mode === m.value
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-gray-800 text-white/70"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🆕 MATCH TYPE */}
        <div>
          <label className="text-sm text-white/70">Match Type</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setMatchType("target")}
              className={`px-3 py-2 rounded ${
                matchType === "target"
                  ? "bg-emerald-600"
                  : "bg-gray-800"
              }`}
            >
              Target Score
            </button>

            <button
              onClick={() => setMatchType("per-lead")}
              className={`px-3 py-2 rounded ${
                matchType === "per-lead"
                  ? "bg-emerald-600"
                  : "bg-gray-800"
              }`}
            >
              Per Lead (1 Round)
            </button>
          </div>
        </div>

        {/* 🎯 TARGET SCORE (ONLY FOR TARGET MODE) */}
        {matchType === "target" && (
          <div>
            <label className="text-sm text-white/70">Target Score</label>
            <input
              type="number"
              min={50}
              step={10}
              value={targetScore}
              onChange={(e) => setTargetScore(+e.target.value)}
              className="w-full mt-2 bg-gray-800 border border-white/10 rounded-lg p-2 text-white"
            />
          </div>
        )}

        {/* ROOM TYPE */}
        <div>
          <label className="text-sm text-white/70">Room Type</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setIsPaid(false)}
              className={`px-3 py-2 rounded ${
                !isPaid ? "bg-emerald-600" : "bg-gray-800"
              }`}
            >
              Free
            </button>

            <button
              onClick={() => setIsPaid(true)}
              className={`px-3 py-2 rounded ${
                isPaid ? "bg-emerald-600" : "bg-gray-800"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {isPaid && (
          <div>
            <label className="text-sm text-white/70">Entry Fee (TK)</label>
            <input
              type="number"
              min={10}
              step={10}
              value={entryFee}
              onChange={(e) => setEntryFee(+e.target.value)}
              className="mt-2 w-full bg-gray-800 border border-white/10 rounded-lg p-2 text-white"
            />
          </div>
        )}

        <Button className="w-full bg-emerald-600" onClick={submit}>
          Create Room
        </Button>
      </div>
    </div>
  );
}
