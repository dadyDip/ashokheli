// app/page.js - UPDATED WITH CASINO SECTION
"use client";

import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";
import { HeroSection } from "./design/HeroSection";
import { GameRoomCard } from "./design/GameRoomCard";
import { LudoRoomCard } from "./design/LudoRoomCard";
import InstantMatchModal from "@/components/InstantMatchModal";
import { useLang } from "@/app/i18n/useLang";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { socket, ready: socketReady } = useSocket();
  const { t } = useLang();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  
  // Casino state
  const [bonusAmount, setBonusAmount] = useState(1010000);
  const [isLaunching, setIsLaunching] = useState(false);

  // Featured casino games
  const featuredCasinoGames = [
    {
      game_code: "737",
      game_name: "Aviator",
      game_img: "https://softapi2.shop/uploads/games/aviator-a04d1f3eb8ccec8a4823bdf18e3f0e84.png",
      category: "flash",
      providerId: "57",
      providerName: "Spribe"
    },
    {
      game_code: "581",
      game_name: "Super Ace Deluxe",
      game_img: "https://softapi2.shop/uploads/games/49[1].png",
      category: "flash",
      providerId: "49",
      providerName: "JILI"
    },
    {
      game_code: "642",
      game_name: "Crazy777",
      game_img: "https://softapi2.shop/uploads/games/crazy777-8c62471fd4e28c084a61811a3958f7a1.png",
      category: "Slots",
      providerId: "49",
      providerName: "JILI"
    },
    {
      game_code: "709",
      game_name: "Wild Ace",
      game_img: "https://softapi2.shop/uploads/games/wild-ace-9a3b65e2ae5343df349356d548f3fc4b.png",
      category: "Slots",
      providerId: "49",
      providerName: "JILI"
    },
    {
      game_code: "519",
      game_name: "Arena Fighter",
      game_img: "https://softapi2.shop/uploads/games/arena-fighter-71468f38b1fa17379231d50635990c31.png",
      category: "flash",
      providerId: "49",
      providerName: "JILI"
    },
    {
      game_code: "879",
      game_name: "Super Ace",
      game_img: "https://softapi2.shop/uploads/games/super-ace-bdfb23c974a2517198c5443adeea77a8.png",
      category: "flash",
      providerId: "49",
      providerName: "JILI"
    },
    {
      game_code: "145",
      game_name: "Baccarat Deluxe",
      game_img: "https://softapi2.shop/uploads/games/baccarat-deluxe-22c3b8df172b40ac24a7e9c909e0e50e.png",
      category: "Slots",
      providerId: "45",
      providerName: "PGSoft"
    },
    {
      game_code: "149",
      game_name: "Jungle Delight",
      game_img: "https://softapi2.shop/uploads/games/jungle-delight-232e8e0c74f9bb16ab676e5ed49d72b4.png",
      category: "Slots",
      providerId: "45",
      providerName: "PGSoft"
    },
    {
      game_code: "6261",
      game_name: "French Roulette Gold",
      game_img: "https://softapi2.shop/uploads/games/french_roulette_gold.webp",
      category: "CasinoLive",
      providerId: "58",
      providerName: "Evolution Live"
    }
  ];

  // Premium providers
  const casinoProviders = [
    {
      brand_id: "49",
      brand_title: "JILI",
      logo: "https://softapi2.shop/uploads/brands/jili.png",
      bgClass: "bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20",
      borderClass: "border border-yellow-500/30"
    },
    {
      brand_id: "45",
      brand_title: "PGSoft",
      logo: "https://softapi2.shop/uploads/brands/pgsoft.png",
      bgClass: "bg-white",
      borderClass: "border border-purple-500/20"
    },
    {
      brand_id: "57",
      brand_title: "Spribe",
      logo: "https://softapi2.shop/uploads/brands/spribe.png",
      bgClass: "bg-white",
      borderClass: "border border-green-500/20"
    },
    {
      brand_id: "58",
      brand_title: "Evolution Live",
      logo: "https://softapi2.shop/uploads/brands/brand_58_1759739497.png",
      bgClass: "bg-white",
      borderClass: "border border-blue-500/20"
    }
  ];

  // Ludo state
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomIdInput, setRoomIdInput] = useState("");

  // Card game state
  const [cardRoomInput, setCardRoomInput] = useState("");
  const [cardGameMode, setCardGameMode] = useState("callbreak");
  const [targetScore, setTargetScore] = useState(30);

  const startDemoCardGame = (mode, matchType = "per-lead") => {
    const demoRoomId = `demo-${mode}-${uuidv4().slice(0, 6)}`;

    socket.emit("create-demo-room", {
      roomId: demoRoomId,
      gameType: mode,
      matchType,
      targetScore: 30,
      maxRounds: matchType === "per-lead" ? 1 : null,
      bots: 3,
    });

    router.push(`/game/cards/${demoRoomId}?mode=${mode}&demo=1`);
  };

  const openInstantMatchModal = (mode) => {
    setSelectedMode(mode);
    setShowModal(true);
  };

  const startInstantMatch = async ({
    mode,
    matchType,
    targetScore,
    entryFee,
  }) => {
    if (!socketReady || !socket) {
      alert("Server not ready");
      return;
    }

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "CREATE",
        gameType: mode,
        matchType,
        targetScore: matchType === "target" ? targetScore : null,
        entryFee: entryFee * 100,
        maxPlayers: 4,
        instant: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed to create match");
      return;
    }

    router.push(`/game/cards/${data.roomId}?mode=${mode}&instant=1`);
  };

  const startDemoLudo = () => {
    const demoRoomId = `demo-ludo-${uuidv4().slice(0, 6)}`;
    router.push(`/game/ludo/${demoRoomId}?demo=1`);
  };

  // ================= INIT =================
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }

    let pid = localStorage.getItem("playerId");
    if (!pid) {
      const pid = "p-" + uuidv4().slice(0, 8);
      localStorage.setItem("playerId", pid);
    }
    setPlayerId(pid);
    setLoading(false);

    // Bonus counter animation
    let currentAmount = 1010000;
    const incrementInterval = setInterval(() => {
      currentAmount += 10;
      setBonusAmount(currentAmount);
    }, 1000);

    return () => clearInterval(incrementInterval);
  }, []);

  // ================= AUTH GUARD =================
  const requireAuth = (fn) => {
    if (!token || !user) {
      router.push("/login");
      return;
    }
    fn();
  };

  const createLudoRoom = async ({ maxPlayers, entryFee }) => {
    try {
      // Convert entryFee to paisa for comparison
      const entryFeeInPaisa = entryFee * 100;
      
      if (entryFee > 0 && user.balance < entryFeeInPaisa) {
        alert(`❌ Not enough balance\nYour balance: ${(user.balance / 100).toFixed(2)} TK\nRequired: ${entryFee} TK`);
        return;
      }

      const res = await fetch("/api/ludo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxPlayers,
          entryFee: entryFee * 100,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to create room");
        return;
      }

      router.push(`/game/ludo/${data.roomId}`);
    } catch (err) {
      console.error(err);
      alert("Could not create Ludo room");
    }
  };

  const joinLudoRoom = () => {
    if (!roomIdInput) return;
    router.push(`/game/ludo/${roomIdInput}`);
  };

  // ===== CREATE CARD ROOM =====
  const createCardRoom = async ({ mode, matchType, targetScore, entryFee }) => {
    if (!socketReady || !socket) {
      alert("Game server not ready yet, please wait 1–2 seconds");
      return;
    }

    try {
      // Get fresh balance from API
      const token = localStorage.getItem("token");
      const balanceRes = await fetch("/api/wallet/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!balanceRes.ok) {
        alert("Failed to fetch balance");
        return;
      }
      
      const balanceData = await balanceRes.json();
      const userBalance = balanceData.balance || 0; // This is in paisa
      
      // Convert entryFee to paisa for comparison
      const entryFeeInPaisa = entryFee * 100;
      
      if (entryFee > 0 && userBalance < entryFeeInPaisa) {
        alert(`❌ Not enough balance to create a paid room.\nYour balance: ${(userBalance / 100).toFixed(2)} TK\nRequired: ${entryFee} TK`);
        return;
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "CREATE",
          gameType: mode,
          matchType,
          targetScore,
          entryFee: Number(entryFee) * 100,
          maxPlayers: 4,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to create room");
        return;
      }

      const roomId = data.roomId;
      router.push(`/game/cards/${roomId}?mode=${mode}`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  // ===== JOIN CARD ROOM =====
  const joinCardRoom = async (roomId) => {
    try {
      if (!roomId) {
        alert("Enter room ID");
        return;
      }
      if (!socketReady || !socket) {
        alert("Connecting to game server… please wait");
        return;
      }

      // Get fresh balance from API
      const token = localStorage.getItem("token");
      const balanceRes = await fetch("/api/wallet/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!balanceRes.ok) {
        alert("Failed to fetch balance");
        return;
      }
      
      const balanceData = await balanceRes.json();
      const userBalance = balanceData.balance || 0;

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "JOIN",
          roomId: roomId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to join room");
        return;
      }

      const roomEntryFee = data.entryFee || 0;
      const roomEntryFeeInTaka = roomEntryFee / 100;
      
      if (roomEntryFee > 0 && userBalance < roomEntryFee) {
        alert(`❌ Not enough balance to join this paid room.\nYour balance: ${(userBalance / 100).toFixed(2)} TK\nRequired: ${roomEntryFeeInTaka} TK`);
        return;
      }

      router.push(`/game/cards/${roomId}?mode=${data.gameType || "callbreak"}`);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room");
    }
  };

  const launchCasinoGame = async (game) => {
    if (!user) {
      alert("Please login first to play casino games");
      window.location.href = '/login';
      return;
    }

    setIsLaunching(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Store game info for the embed page
      localStorage.setItem('lastGameLaunched', JSON.stringify({
        name: game.name,
        code: game.game_code,
        provider: game.provider,
        providerId: game.providerId,
        image: game.image_url,
        timestamp: new Date().toISOString()
      }));
      
      // Redirect to our embedded game page (not opening new tab)
      const embedUrl = `/casino/play/${game.game_code}?provider=${game.providerId}`;
      window.location.href = embedUrl; // Redirect current page
      
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setIsLaunching(false);
    }
  };


  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white">
      {/* Casino Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-black to-purple-900/5"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600 rounded-full blur-[120px] animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[140px] animate-pulse delay-700 opacity-25"></div>
      </div>

      <div className="relative z-10">
        <main>
          <HeroSection
            onCreateCard={(data) => requireAuth(() => createCardRoom(data))}
            onJoinCard={() => requireAuth(joinCardRoom)}
            onCreateLudoRoom={(data) =>
              requireAuth(() => createLudoRoom(data))
            }
            onJoinLudo={() => requireAuth(joinLudoRoom)}
            onSetLudoRoomId={setRoomIdInput}
          />

          {/* CASINO SECTION - ADDED AFTER HERO */}
          <section className="max-w-7xl mx-auto mt-12 md:mt-16 px-4">
            {/* Section Header with Bengali */}
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              <h2 className="text-base md:text-lg font-bold text-white mx-3 md:mx-4">
                🎰 প্রিমিয়াম ক্যাসিনো গেমস
              </h2>
              <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            </div>

            {/* Bonus Counter - Same as Casino Page */}
            <div className="mb-10 md:mb-14 h-36 md:h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/30 via-yellow-800/40 to-yellow-900/30 rounded-xl md:rounded-2xl border-2 border-yellow-600/40 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-shine"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6">
                  <div className="text-yellow-300 text-sm md:text-base font-bold tracking-widest uppercase mb-2 md:mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    লাইউ উইন্স কাউন্টার
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="text-2xl md:text-4xl lg:text-5xl font-black text-yellow-200 font-mono tracking-wider mb-1 md:mb-2">
                    ৳ {formatNumber(bonusAmount)}
                  </div>
                  
                  <div className="text-yellow-500/70 text-xs md:text-sm font-medium">
                    প্রতি সেকেন্ডে বাড়ছে +৳১০
                  </div>
                </div>
              </div>
            </div>

            {/* 9 Featured Casino Games */}
            <div className="mb-10 md:mb-14">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="text-white text-sm md:text-base font-medium">
                  ৯টি সেরা গেমস
                </div>
                <Link 
                  href="/casino" 
                  className="text-xs md:text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  সব দেখুন →
                </Link>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {featuredCasinoGames.map((game) => (
                  <div
                    key={game.game_code}
                    onClick={() => launchCasinoGame(game)}
                    className="group relative transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 shadow-lg">
                      {game.game_img ? (
                        <img
                          src={game.game_img}
                          alt={game.game_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-xl md:text-2xl">🎮</div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70"></div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <div className="text-white text-xs md:text-sm font-medium truncate text-center">
                          {game.game_name}
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-600/90 px-4 py-2 rounded-full text-white text-xs font-bold">
                          খেলুন
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Providers */}
            <div className="mb-10 md:mb-14">
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <h3 className="text-sm md:text-base font-bold text-white mx-3 md:mx-4">
                  প্রিমিয়াম প্রোভাইডার
                </h3>
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {casinoProviders.map((provider) => (
                  <Link
                    key={provider.brand_id}
                    href={`/casino/providers/${provider.brand_id}/games`}
                    className={`group relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${provider.bgClass} ${provider.borderClass}`}
                  >
                    <div className="aspect-[3/1] md:aspect-[16/9] flex items-center justify-center p-3 md:p-6">
                      <div className="w-full h-full flex items-center justify-center p-1 md:p-4">
                        {provider.logo ? (
                          <img
                            src={provider.logo}
                            alt={provider.brand_title}
                            className="max-w-full max-h-16 md:max-h-full object-contain" 
                          />
                        ) : (
                          <div className="text-2xl md:text-4xl">🎰</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Go to Casino CTA */}
            <div className="text-center mb-12 md:mb-16">
              <div className="text-gray-300 text-sm md:text-base mb-4">
                আরও ৫০০+ প্রিমিয়াম গেমসের জন্য
              </div>
              <Link
                href="/casino"
                className="inline-flex items-center gap-2 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm md:text-base font-bold hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
              >
                <span>পুরো ক্যাসিনো দেখুন</span>
                <span className="text-lg md:text-xl">→</span>
              </Link>
            </div>
          </section>

          {/* Original Games Section - Updated
          // <section className="max-w-6xl mx-auto mt-8 px-4">
          //   <h2 className="text-3xl font-bold mb-8 text-white">
          //     🔴 {t.runningMatch}
          //   </h2>

          //   <div className="grid md:grid-cols-2 gap-6">
          //     <GameRoomCard
          //       title={t.callbreakTitle}
          //       description={t.callbreakDesc}
          //       players="3/4"
          //       badge={t.running}
          //       gameImage="/images/card-game.jpg"
          //       onJoin={() => requireAuth(() => openInstantMatchModal("callbreak"))}
          //     />

          //     <GameRoomCard
          //       title={t.sevenTitle}
          //       description={t.sevenDesc}
          //       players="3/4"
          //       badge={t.started}
          //       gameImage="/images/sevencall-img-demo.jpg"
          //       onJoin={() => requireAuth(() => openInstantMatchModal("seven"))}
          //     />

          //     <GameRoomCard
          //       title={t.ludoTitle}
          //       description={t.ludoDesc}
          //       players="3/4"
          //       badge={t.running}
          //       gameImage="/images/ludo.jpg"
          //       onJoin={() => requireAuth(startDemoLudo)}
          //     />
          //     <InstantMatchModal
          //       open={showModal}
          //       gameMode={selectedMode}
          //       onClose={() => setShowModal(false)}
          //       onStart={(config) => startInstantMatch(config)}
          //     />
          //   </div>
          // </section> */}
        </main>
      </div>

      {/* Launching Overlay */}
      {isLaunching && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-bold text-white">গেম লোড হচ্ছে...</div>
            <div className="text-gray-400 text-sm mt-2">অপেক্ষা করুন</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}