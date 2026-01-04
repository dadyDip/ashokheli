"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/design/ui/button";

export function CreateLudoRoomModal({
  open,
  onClose,
  onCreate,
  userBalance,
}) {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(50);

  if (!open) return null;

  const submit = async () => {
    if (isPaid && entryFee < 10) {
      alert("Minimum entry fee is 10 TK");
      return;
    }

    if (isPaid && userBalance < entryFee) {
      alert("❌ Not enough balance");
      return;
    }

    await onCreate({
      maxPlayers,
      entryFee: isPaid ? entryFee : 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold text-white">
          Create Ludo Room
        </h2>

        {/* MAX PLAYERS */}
        <div>
          <label className="text-sm text-white/70">
            Max Players
          </label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  maxPlayers === n
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-gray-800 text-white/70"
                }`}
              >
                {n} Players
              </button>
            ))}
          </div>
        </div>

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

        {/* ENTRY FEE */}
        {isPaid && (
          <div>
            <label className="text-sm text-white/70">
              Entry Fee (TK)
            </label>
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

        <Button
          className="w-full bg-emerald-600"
          onClick={submit}
        >
          Create Room
        </Button>
      </div>
    </div>
  );
}
