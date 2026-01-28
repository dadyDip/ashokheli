"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export default function InstantMatchModal({
  open,
  gameMode,
  onClose,
  onStart,
}) {
  const [matchType, setMatchType] = useState("per-lead");
  const [targetScore, setTargetScore] = useState(30);
  const [entryType, setEntryType] = useState("free");
  const [entryFee, setEntryFee] = useState(0);
  const { t } = useLang();


  if (!open) return null;

  const handleStart = () => {
    onStart({
      mode: gameMode,
      matchType,
      targetScore: matchType === "target" ? targetScore : null,
      entryFee: entryType === "paid" ? Number(entryFee) : 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 space-y-5">
        
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X />
        </button>

        {/* TITLE */}
        <h2 className="text-xl font-bold text-white">
          ⚡ {t.instantMatch}
          <span className="block text-sm font-normal text-emerald-400 mt-1">
            {gameMode.toUpperCase()}
          </span>
        </h2>


        {/* MATCH TYPE */}
        <div>
          <label className="text-sm text-white/70">{t.matchType}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setMatchType("per-lead")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                matchType === "per-lead"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-gray-800 text-white/70"
              }`}
            >
              {t.perLead}
            </button>

            <button
              onClick={() => setMatchType("target")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                matchType === "target"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-gray-800 text-white/70"
              }`}
            >
              {t.targetScoreType}
            </button>
          </div>
        </div>

        {/* TARGET SCORE */}
        {matchType === "target" && (
          <div>
            <label className="text-sm text-white/70">{t.targetScore}</label>
            <input
              type="number"
              min={10}
              step={10}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full mt-2 bg-gray-800 border border-white/10 rounded-lg p-2 text-white"
            />
          </div>
        )}

        {/* ENTRY TYPE */}
        <div>
          <label className="text-sm text-white/70">{t.entryType}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setEntryType("free")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                entryType === "free"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-gray-800 text-white/70"
              }`}
            >
              {t.free}
            </button>

            <button
              onClick={() => setEntryType("paid")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                entryType === "paid"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-gray-800 text-white/70"
              }`}
            >
              {t.paid}
            </button>
          </div>
        </div>

        {/* ENTRY FEE */}
        {entryType === "paid" && (
          <div>
            <label className="text-sm text-white/70">{t.entryFee}</label>
            <input
              type="number"
              min={10}
              step={10}
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              className="w-full mt-2 bg-gray-800 border border-white/10 rounded-lg p-2 text-white"
            />
          </div>
        )}

        {/* ACTION */}
        <button
          onClick={handleStart}
          className="w-full bg-emerald-600 hover:bg-emerald-500 transition rounded-lg py-2 font-semibold"
        >
          {t.startMatch}
        </button>
      </div>
    </div>
  );
}
