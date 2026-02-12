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
  const [hasTurnover, setHasTurnover] = useState(false);

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
      game_code: "916",
      game_name: "Wild Bounty Showdown",
      game_img: "https://softapi2.shop/uploads/games/wild-bounty-showdown-c98bb64436826fe9a2c62955ff70cba9.png",
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

    // Bonus counter animation - Start from random value above 200M
    // Generate random number between 200,000,000 and 350,000,000
    // Using realistic bonus amounts
    const minBonus = 200000000; // 200M
    const maxBonus = 350000000; // 350M
    
    // Create more varied starting points (200M, 210M, 225M, 245M, 280M, 310M, etc.)
    const randomStep = Math.floor(Math.random() * 15) * 10000000; // 0-140M in 10M steps
    const randomStart = minBonus + randomStep + Math.floor(Math.random() * 5000000);
    
    let currentAmount = randomStart;
    setBonusAmount(currentAmount);
    
    console.log(`Bonus counter starting from: ${currentAmount.toLocaleString()}`);

    const incrementInterval = setInterval(() => {
      currentAmount += 10;
      setBonusAmount(currentAmount);
    }, 1000);

    return () => clearInterval(incrementInterval);
  }, []);

  const checkTurnoverStatus = async (userToken) => {
    try {
      const res = await fetch("/api/wallet/summary", {
        headers: {
          Authorization: `Bearer ${userToken || token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        // Set state for UI updates if needed
        setHasTurnover(data.isBalanceLocked || false);
        
        if (data.isBalanceLocked) {
          // Get Bengali/English message based on user preference
          const lang = localStorage.getItem('lang') || 'bn';
          const message = lang === 'bn' 
            ? "❌ টার্নওভার সম্পূর্ণ না হওয়া পর্যন্ত রুম তৈরি বা যোগদান করা যাবে না। প্রথমে ক্যাসিনোতে গেম খেলে টার্নওভার শেষ করুন।"
            : "❌ You cannot create or join rooms until turnover is completed. Please complete turnover by playing casino games first.";
          
          alert(message);
          return false;
        }
        return true;
      }
    } catch (err) {
      console.error("Turnover check error:", err);
    }
    return true; // Allow by default if API fails
  };

  // ================= AUTH GUARD =================
  const requireAuth = async (fn) => {
    console.log("requireAuth called, token:", !!token, "user:", !!user); // Debug
    if (!token || !user) {
      router.push("/login");
      return;
    }
    
    // Check turnover status before allowing any room action
    console.log("Checking turnover status..."); // Debug
    const canProceed = await checkTurnoverStatus(token);
    console.log("Turnover check result:", canProceed); // Debug
    
    if (!canProceed) {
      return;
    }
    
    console.log("Executing function"); // Debug
    fn();
  };
  
  const createLudoRoom = async ({ maxPlayers, entryFee }) => {
    const canProceed = await checkTurnoverStatus(token);
    if (!canProceed) {
      return;
    }
    
    // HARDCODED SERVER MAINTENANCE MESSAGE
    const lang = localStorage.getItem('lang') || 'bn';
    const message = lang === 'bn' 
      ? "🚧 সার্ভার মেইনটেনেন্স চলছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
      : "🚧 Server under maintenance. Please try again later.";
    
    alert(message);
    return;
    
    /* 
    // COMMENTED OUT THE REST OF THE FUNCTION SINCE SERVER IS DOWN
    try {
      // Convert entryFee to paisa for comparison
      const entryFeeInPaisa = entryFee * 100;
      
      if (entryFee > 0 && user.balance < entryFeeInPaisa) {
        // Multi-language balance error message
        const lang = localStorage.getItem('lang') || 'bn';
        const message = lang === 'bn' 
          ? `❌ পর্যাপ্ত ব্যালেন্স নেই\nআপনার ব্যালেন্স: ${(user.balance / 100).toFixed(2)} টাকা\nপ্রয়োজন: ${entryFee} টাকা`
          : `❌ Not enough balance\nYour balance: ${(user.balance / 100).toFixed(2)} TK\nRequired: ${entryFee} TK`;
        
        alert(message);
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
    */
  };

  // const createLudoRoom = async ({ maxPlayers, entryFee }) => {
  //   const canProceed = await checkTurnoverStatus(token);
  //   if (!canProceed) {
  //     return;
  //   }
  //   try {
  //     // Convert entryFee to paisa for comparison
  //     const entryFeeInPaisa = entryFee * 100;
      
  //     if (entryFee > 0 && user.balance < entryFeeInPaisa) {
  //       alert(`❌ Not enough balance\nYour balance: ${(user.balance / 100).toFixed(2)} TK\nRequired: ${entryFee} TK`);
  //       return;
  //     }

  //     const res = await fetch("/api/ludo/create", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         maxPlayers,
  //         entryFee: entryFee * 100,
  //         userId: user.id,
  //       }),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       alert(data?.error || "Failed to create room");
  //       return;
  //     }

  //     router.push(`/game/ludo/${data.roomId}`);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Could not create Ludo room");
  //   }
  // };

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
    const canProceed = await checkTurnoverStatus(token);
    if (!canProceed) {
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

  const joinCardRoom = async (roomId) => {
    
    // First check if user is authenticated
    if (!token || !user) {
      router.push("/login");
      return;
    }
    
    // Then check turnover status
    const canProceed = await checkTurnoverStatus(token);
    if (!canProceed) {
      console.log("Turnover check failed"); // Debug
      return;
    }
    
    try {
      console.log("Attempting to join room:", roomId); // Debug
      
      if (!socketReady || !socket) {
        const lang = localStorage.getItem('lang') || 'bn';
        const message = lang === 'bn' 
          ? "গেম সার্ভারের সাথে সংযোগ করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন"
          : "Connecting to game server… please wait";
        alert(message);
        return;
      }

      // Get fresh balance from API - DON'T redeclare token
      const currentToken = localStorage.getItem("token"); // ✅ Use different variable name
      const balanceRes = await fetch("/api/wallet/summary", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      
      if (!balanceRes.ok) {
        const lang = localStorage.getItem('lang') || 'bn';
        const message = lang === 'bn' 
          ? "ব্যালেন্স চেক করতে ব্যর্থ হয়েছে"
          : "Failed to fetch balance";
        alert(message);
        return;
      }
      
      const balanceData = await balanceRes.json();
      const userBalance = balanceData.balance || 0;
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
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
        const lang = localStorage.getItem('lang') || 'bn';
        const message = lang === 'bn' 
          ? `❌ পেইড রুমে যোগ দিতে পর্যাপ্ত ব্যালেন্স নেই।\nআপনার ব্যালেন্স: ${(userBalance / 100).toFixed(2)} টাকা\nপ্রয়োজন: ${roomEntryFeeInTaka} টাকা`
          : `❌ Not enough balance to join this paid room.\nYour balance: ${(userBalance / 100).toFixed(2)} TK\nRequired: ${roomEntryFeeInTaka} TK`;
        
        alert(message);
        return;
      }
      router.push(`/game/cards/${roomId}?mode=${data.gameType || "callbreak"}`);
    } catch (error) {
      console.error("Error joining room:", error);
      
      const lang = localStorage.getItem('lang') || 'bn';
      const message = lang === 'bn' 
        ? "রুমে যোগ দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
        : "Failed to join room. Please try again.";
      
      alert(message);
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
            onJoinCard={(roomId) => requireAuth(() => joinCardRoom(roomId))}
            onCreateLudoRoom={(data) =>
              requireAuth(() => createLudoRoom(data))
            }
            onJoinLudo={() => requireAuth(joinLudoRoom)}
            onSetLudoRoomId={setRoomIdInput}
          />
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