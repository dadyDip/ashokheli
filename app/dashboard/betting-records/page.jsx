// app/dashboard/betting-records/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trophy, 
  Dice1,
  Dice2,
  Dice3,
  AlertCircle
} from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export default function BettingRecordsPage() {
  const router = useRouter();
  const { t, lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bettingHistory, setBettingHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [error, setError] = useState("");

  // Categories
  const categories = [
    { id: "small", name: "0 - 10", min: 0, max: 10, icon: Dice1 },
    { id: "medium", name: "10 - 99", min: 10, max: 99, icon: Dice2 },
    { id: "large", name: "100 - All", min: 100, max: Infinity, icon: Dice3 },
    { id: "all", name: "All Bets", min: 0, max: Infinity, icon: Trophy }
  ];

  // Texts
  const texts = {
    en: {
      bettingRecords: "Betting Records",
      back: "Back",
      allBets: "All Bets",
      small: "0 - 10",
      medium: "10 - 99",
      large: "100 - All",
      gameName: "Game",
      betAmount: "Bet",
      winAmount: "Win",
      result: "Result",
      date: "Date",
      time: "Time",
      win: "Win",
      loss: "Loss",
      noBets: "No betting records found",
      noBetsDesc: "Start playing games to see your betting history",
      playNow: "Play Now",
      filterBy: "Filter by amount",
      gameRound: "Round ID",
      profit: "P/L",
      casino: "Casino",
      loading: "Loading betting records...",
      error: "Failed to load betting records",
      allTime: "All Time Records",
      bets: "bets",
      shown: "shown"
    },
    bn: {
      bettingRecords: "বেটিং রেকর্ড",
      back: "পেছনে",
      allBets: "সব বেট",
      small: "০ - ১০",
      medium: "১০ - ৯৯",
      large: "১০০ - সর্বোচ্চ",
      gameName: "গেম",
      betAmount: "বেট",
      winAmount: "জয়",
      result: "ফলাফল",
      date: "তারিখ",
      time: "সময়",
      win: "জয়",
      loss: "হার",
      noBets: "কোন বেটিং রেকর্ড পাওয়া যায়নি",
      noBetsDesc: "আপনার বেটিং ইতিহাস দেখতে গেম খেলা শুরু করুন",
      playNow: "এখন খেলুন",
      filterBy: "পরিমাণ অনুসারে ফিল্টার",
      gameRound: "রাউন্ড আইডি",
      profit: "লাভ/ক্ষতি",
      casino: "ক্যাসিনো",
      loading: "বেটিং রেকর্ড লোড হচ্ছে...",
      error: "বেটিং রেকর্ড লোড করতে ব্যর্থ",
      allTime: "সর্বকালের রেকর্ড",
      bets: "টি বেট",
      shown: "টি দেখানো হচ্ছে"
    }
  };

  const currentText = texts[lang] || texts.en;

  // Fetch ALL casino betting history
  useEffect(() => {
    fetchAllBettingHistory();
  }, []);

  // Filter history when category changes
  useEffect(() => {
    filterHistoryByCategory();
  }, [selectedCategory, bettingHistory]);

  const fetchAllBettingHistory = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      // Fetch ALL casino spins - no limit
      const casinoRes = await fetch("/api/casino/history?all=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!casinoRes.ok) {
        throw new Error("Failed to fetch casino history");
      }
      
      const casinoData = await casinoRes.json();
      
      // Transform casino data to uniform format
      let allBets = [];
      
      // Get spins from casinoData
      if (casinoData.spins && casinoData.spins.length > 0) {
        const casinoBets = casinoData.spins.map(spin => ({
          id: spin.id,
          gameName: spin.gameName || spin.gameCode || "Casino",
          gameType: "casino",
          betAmount: spin.betAmount / 100,
          winAmount: spin.winAmount / 100,
          result: spin.winAmount > spin.betAmount ? "win" : "loss",
          status: spin.status || "completed",
          date: spin.timestamp || spin.createdAt,
          roundId: spin.gameRound || spin.id,
          profit: (spin.winAmount - spin.betAmount) / 100
        }));
        
        allBets = [...allBets, ...casinoBets];
      }
      
      // Get games from casinoData
      if (casinoData.games && casinoData.games.length > 0) {
        const gameBets = casinoData.games.map(game => ({
          id: game.id,
          gameName: game.gameType || "Casino Game",
          gameType: "casino",
          betAmount: game.stake / 100,
          winAmount: game.winAmount ? game.winAmount / 100 : 0,
          result: game.winAmount > game.stake ? "win" : "loss",
          status: game.status || "completed",
          date: game.finishedAt || game.startedAt || game.createdAt,
          roundId: game.matchId || game.id,
          profit: game.winAmount ? (game.winAmount - game.stake) / 100 : -game.stake / 100
        }));
        
        allBets = [...allBets, ...gameBets];
      }
      
      // Sort by date (newest first) - ALL records from beginning
      allBets.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log(`Loaded ${allBets.length} total betting records`);
      setBettingHistory(allBets);
      
    } catch (error) {
      console.error("Error fetching betting history:", error);
      setError(currentText.error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistoryByCategory = () => {
    if (!bettingHistory.length) return;
    
    const category = categories.find(c => c.id === selectedCategory);
    
    if (selectedCategory === "all") {
      setFilteredHistory(bettingHistory);
    } else {
      const filtered = bettingHistory.filter(
        bet => bet.betAmount >= category.min && bet.betAmount < category.max
      );
      setFilteredHistory(filtered);
    }
  };

  const getGameIcon = (gameType) => {
    switch(gameType?.toLowerCase()) {
      case "casino":
        return "🎰";
      case "sports":
        return "⚽";
      case "cards":
        return "🃏";
      case "racing":
        return "🏇";
      case "pvp":
        return "👥";
      default:
        return "🎮";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return lang === 'bn' ? 'আজ' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return lang === 'bn' ? 'গতকাল' : 'Yesterday';
    } else {
      return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">{currentText.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchAllBettingHistory()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Maroon */}
      <div className="fixed top-0 left-0 right-0 bg-[#800000] h-20 z-50 flex items-center justify-between px-5 shadow-lg">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <h1 className="text-xl font-bold text-white">
          {currentText.bettingRecords}
        </h1>
        
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-10 px-5">
        {/* Total Records Count */}
        {bettingHistory.length > 0 && (
          <div className="mt-4 mb-2 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {currentText.allTime}: {bettingHistory.length} {currentText.bets}
            </p>
            <p className="text-xs text-gray-400">
              {filteredHistory.length} {currentText.shown}
            </p>
          </div>
        )}

        {/* Category Tabs */}
        {bettingHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">{currentText.filterBy}</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                const count = bettingHistory.filter(b => 
                  b.betAmount >= category.min && b.betAmount < category.max
                ).length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative py-3 px-2 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon className={`w-5 h-5 ${
                        isSelected ? "text-red-500" : "text-gray-500"
                      }`} />
                      <span className="text-xs font-medium">
                        {category.name}
                      </span>
                      <span className={`text-[10px] ${
                        isSelected ? "text-red-600" : "text-gray-500"
                      }`}>
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ALL BETTING RECORDS - From beginning of account */}
        {filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((bet) => (
              <div
                key={bet.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
              >
                {/* Top row - Game name, round ID, profit/loss */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {getGameIcon(bet.gameType)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{bet.gameName}</h3>
                      <p className="text-xs text-gray-500 font-mono">
                        #{bet.roundId?.slice(-8) || bet.id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      bet.result === "win" ? "text-green-600" : "text-red-600"
                    }`}>
                      {bet.result === "win" ? "+" : "-"} ৳ {Math.abs(bet.profit).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Bottom row - Bet amount, Win amount, Result, Date/Time */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">{currentText.betAmount}</p>
                    <p className="text-sm font-medium text-gray-900">৳ {bet.betAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{currentText.winAmount}</p>
                    <p className="text-sm font-medium text-gray-900">৳ {bet.winAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{currentText.result}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      bet.result === "win" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {bet.result === "win" ? currentText.win : currentText.loss}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{currentText.date}</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(bet.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State - Only when no bets ever */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentText.noBets}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
              {currentText.noBetsDesc}
            </p>
            <button
              onClick={() => router.push("/dashboard/casino")}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition shadow-md"
            >
              {currentText.playNow}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}