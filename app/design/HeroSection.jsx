"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { CreateLudoRoomModal } from "@/components/CreateLudoRoomModal";

export function HeroSection({
  onJoinCard,
  onCreateCard,
  onCreateLudoRoom,
  onJoinLudo,
  onSetLudoRoomId,
}) {
  const [openModal, setOpenModal] = useState(false);

  // ✅ PUT IT HERE (INSIDE COMPONENT)
  const [userBalance, setUserBalance] = useState(null);
  const [openJoinPopup, setOpenJoinPopup] = useState(false);
  const [openLudoJoinPopup, setOpenLudoJoinPopup] = useState(false);
  const [ludoRoomId, setLudoRoomId] = useState("");
  const [showLudoModal, setShowLudoModal] = useState(false);

  const [joinRoomId, setJoinRoomId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/wallet/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // 👇 adjust key if needed
        const balance = data.balance ?? data.walletBalance ?? 0;
        setUserBalance(balance);

        // optional global access
        window.userBalance = balance;
      })
      .catch((err) => {
        console.error("Failed to fetch wallet summary", err);
        setUserBalance(0);
      });
  }, []);


  const handleJoin = () => {
    if (!joinRoomId.trim()) {
      alert("Please enter Room ID");
      return;
    }
    onJoinCard(joinRoomId.trim());
    setOpenJoinPopup(false);
    setJoinRoomId("");
  };

  return (
    <section className="w-full py-14 px-4">
      <div className="max-w-5xl mx-auto">
        {/* TITLE */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white leading-tight">
            First time in Bangladesh ❄️
            <br />
            <span className="text-emerald-400">
              Enjoy cards & board games this winter
            </span>
          </h1>

          <Badge className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Beta • Paid Matches
          </Badge>
        </div>

        {/* GAME CARDS */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* CARD GAME */}
          <div className="relative rounded-2xl overflow-hidden h-80 group">
            <img
              src="/images/room-card-img.png"
              alt="Card Game"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 p-6 space-y-3">
              <h3 className="text-2xl font-bold text-white">🃏 Card Games</h3>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setOpenModal(true)}
                >
                  Create Room
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 text-white"
                  onClick={() => setOpenJoinPopup(true)}
                >
                  Join with Room ID
                </Button>
              </div>
            </div>
          </div>

          {/* LUDO */}
          <div className="relative rounded-2xl overflow-hidden h-80 group">
            <img
              src="/images/room-ludo-img.png"
              alt="Ludo"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 p-6 space-y-3">
              <h3 className="text-2xl font-bold text-white">🎲 Ludo</h3>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowLudoModal(true)}
                >
                  Create Room
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 text-white"
                  onClick={() => setOpenLudoJoinPopup(true)}
                >
                  Join with Room ID
                </Button>


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE ROOM */}
      <CreateRoomModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        game="cards"
        onCreate={onCreateCard}
        userBalance={userBalance}
      />
      <CreateLudoRoomModal
        open={showLudoModal}
        onClose={() => setShowLudoModal(false)}
        onCreate={ onCreateLudoRoom}
        userBalance={userBalance}
      />


      {/* POPUP: JOIN ROOM */}
      {openJoinPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Join Paid Room</h2>
            <input
              type="text"
              placeholder="Paste Room ID here"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 border border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-600" onClick={handleJoin}>
                Join Room
              </Button>
              <Button
                className="flex-1 bg-gray-700"
                onClick={() => setOpenJoinPopup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {openLudoJoinPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Join Ludo Room</h2>

            <input
              type="text"
              placeholder="Enter Ludo Room ID"
              value={ludoRoomId}
              onChange={(e) => setLudoRoomId(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 border border-white/10 text-white"
            />

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600"
                onClick={() => {
                  if (!ludoRoomId.trim()) return;
                  onSetLudoRoomId(ludoRoomId.trim());
                  onJoinLudo();
                  setOpenLudoJoinPopup(false);
                  setLudoRoomId("");
                }}
              >
                Join Room
              </Button>

              <Button
                className="flex-1 bg-gray-700"
                onClick={() => setOpenLudoJoinPopup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
