"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { CreateLudoRoomModal } from "@/components/CreateLudoRoomModal";
import { useLang } from "@/app/i18n/useLang";
import { DepositModal } from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Wallet,
  ArrowDownToLine,
  X,
  Play,
  Crown,
  Gamepad2,
  Tv,
  Swords,
  Fish,
  Dice5,
  Star,
  Sparkles,
  Users,
  Trophy,
  Target,
  Sword,
  Gem,
  Heart,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSection({
  onJoinCard,
  onCreateCard,
  onCreateLudoRoom,
  onJoinLudo,
  onSetLudoRoomId,
}) {
  const { t } = useLang();
  const router = useRouter();

  const [userBalance, setUserBalance] = useState(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // modals
  const [openModal, setOpenModal] = useState(false);
  const [showLudoModal, setShowLudoModal] = useState(false);

  // join popups
  const [openJoinPopup, setOpenJoinPopup] = useState(false);
  const [openLudoJoinPopup, setOpenLudoJoinPopup] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [ludoRoomId, setLudoRoomId] = useState("");

  // slider
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTimer = useRef(null);

  // games scroll refs
  const hotGamesRef1 = useRef(null);
  const hotGamesRef2 = useRef(null);
  const hotGamesRef3 = useRef(null);
  const categoryScrollRef = useRef(null);

  // announcements
  const announcements = useMemo(
    () => [
      "🎉 প্রথম ডিপোজিট বোনাস ৫০% পর্যন্ত!",
      "🔥 লাইভ ক্যাসিনোতে জয় করুন ১০ লাখ টাকা!",
      "💎 VIP মেম্বারদের জন্য বিশেষ উপহার",
      "⚡ দ্রুত উইথড্রো - ৫ মিনিটে পেমেন্ট",
      "🏆 সাপ্তাহিক টুর্নামেন্ট - পুরস্কার ২৫ লাখ টাকা",
      "🎰 নতুন গেমস যোগ হয়েছে - এখনই খেলুন!",
      "🛡️ ১০০% নিরাপদ এবং সুরক্ষিত গেমিং",
      "👑 সেরা খেলোয়াড়দের জন্য বিশেষ রিওয়ার্ড",
    ],
    []
  );

  const [announcementIndex, setAnnouncementIndex] = useState(0);
  
  // All games data
  const [allGames, setAllGames] = useState([]);

  // Jackpot counter
  const [jackpotAmount, setJackpotAmount] = useState(256327890);
  const [jackpotDigits, setJackpotDigits] = useState(["6", "5", "3", "7", "7", "3", "6", "8", ".", "1"]);

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

  // ====== HERO SLIDES ======
  const heroSlides = useMemo(
    () => [
      {
        id: "slide-1",
        img: "/images/hero-red.jpg",
        fallback: "https://images.unsplash.com/photo-1617957718614-8c23f060c2d0?q=80&w=1600&auto=format&fit=crop",
        title: "ওয়েলকাম বোনাস",
        subtitle: "৫০% পর্যন্ত বোনাস পান",
      },
      {
        id: "slide-2",
        img: "/images/hero-red-2.jpg",
        fallback: "https://images.unsplash.com/photo-1617957718614-8c23f060c2d0?q=80&w=1600&auto=format&fit=crop",
        title: "লাইভ ক্যাসিনো",
        subtitle: "রিয়েল-টাইম গেমিং",
      },
      {
        id: "slide-3",
        img: "/images/hero-red-3.jpg",
        fallback: "https://images.unsplash.com/photo-1617957718614-8c23f060c2d0?q=80&w=1600&auto=format&fit=crop",
        title: "VIP মেম্বারশিপ",
        subtitle: "এক্সক্লুসিভ সুবিধা",
      },
    ],
    []
  );
  
  // ====== CATEGORY ICONS ======
  const categories = useMemo(
    () => [
      { id: "hot", label: "গরম", icon: <Flame className="w-5 h-5" />, color: "from-orange-500 to-red-500", bg: "bg-gradient-to-br from-orange-500/20 to-red-500/20" },
      { id: "slots", label: "স্লটস", icon: <Star className="w-5 h-5" />, color: "from-purple-500 to-pink-500", bg: "bg-gradient-to-br from-purple-500/20 to-pink-500/20" },
      { id: "live", label: "লাইভ", icon: <Tv className="w-5 h-5" />, color: "from-red-500 to-orange-500", bg: "bg-gradient-to-br from-red-500/20 to-orange-500/20" },
      { id: "fishing", label: "ফিশিং", icon: <Fish className="w-5 h-5" />, color: "from-blue-400 to-cyan-500", bg: "bg-gradient-to-br from-blue-400/20 to-cyan-500/20" },
      { id: "cards", label: "কার্ডস", icon: <Gamepad2 className="w-5 h-5" />, color: "from-emerald-500 to-teal-500", bg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" },
      { id: "table", label: "টেবিল", icon: <Target className="w-5 h-5" />, color: "from-yellow-500 to-amber-500", bg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20" },
      { id: "crash", label: "ক্র্যাশ", icon: <TrendingUp className="w-5 h-5" />, color: "from-green-500 to-emerald-500", bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20" },
      { id: "sports", label: "স্পোর্টস", icon: <Trophy className="w-5 h-5" />, color: "from-blue-500 to-cyan-500", bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" },
      { id: "ludo", label: "লুডো", icon: <Dice5 className="w-5 h-5" />, color: "from-rose-500 to-pink-500", bg: "bg-gradient-to-br from-rose-500/20 to-pink-500/20" },
    ],
    []
  );

  // Initialize all games data with reordered games and removed one game
  useEffect(() => {
    // All games combined in one array - REORDERED AND REMOVED ONE GAME
    const allGamesData = [
      {
        game_code: "737",
        game_name: "Aviator",
        game_img: "https://softapi2.shop/uploads/games/aviator-a04d1f3eb8ccec8a4823bdf18e3f0e84.png",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.8
      },
      {
        game_code: "581",
        game_name: "Super Ace Deluxe",
        game_img: "https://softapi2.shop/uploads/games/49[1].png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.5
      },
      {
        game_code: "642",
        game_name: "Crazy777",
        game_img: "https://softapi2.shop/uploads/games/crazy777-8c62471fd4e28c084a61811a3958f7a1.png",
        category: "Slots",
        providerId: "49",
        providerName: "JILI",
        rating: 4.7
      },
      {
        game_code: "709",
        game_name: "Wild Ace",
        game_img: "https://softapi2.shop/uploads/games/wild-ace-9a3b65e2ae5343df349356d548f3fc4b.png",
        category: "Slots",
        providerId: "49",
        providerName: "JILI",
        rating: 4.6
      },
      {
        game_code: "519",
        game_name: "Arena Fighter",
        game_img: "https://softapi2.shop/uploads/games/arena-fighter-71468f38b1fa17379231d50635990c31.png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.4
      },
      {
        game_code: "879",
        game_name: "Super Ace",
        game_img: "https://softapi2.shop/uploads/games/super-ace-bdfb23c974a2517198c5443adeea77a8.png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.9
      },
      {
        game_code: "59",
        game_name: "Super Ace Scratch",
        game_img: "https://softapi2.shop/uploads/games/super-ace-scratch-0ec0aeb7aad8903bb6ee6b9b9460926a.png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.3
      },
      {
        game_code: "925",
        game_name: "Mega Fishing",
        game_img: "https://softapi2.shop/uploads/games/mega-fishing-caacafe3f64a6279e10a378ede09ff38.png",
        category: "Fishing",
        providerId: "49",
        providerName: "JILI",
        rating: 4.7
      },
      // WILD BOUNTY SHOWDOWN MOVED TO 9TH POSITION
      {
        game_code: "916",
        game_name: "Wild Bounty Showdown",
        game_img: "https://softapi2.shop/uploads/games/wild-bounty-showdown-c98bb64436826fe9a2c62955ff70cba9.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.6
      },
      {
        game_code: "426",
        game_name: "Mines",
        game_img: "https://softapi2.shop/uploads/games/mines.webp",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.8
      },
      {
        game_code: "723",
        game_name: "Mini Roulette",
        game_img: "https://softapi2.shop/uploads/games/mini-roulette-9dc7ac6155c5a19c1cc204853e426367.png",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.4
      },
      {
        game_code: "149",
        game_name: "Jungle Delight",
        game_img: "https://softapi2.shop/uploads/games/jungle-delight-232e8e0c74f9bb16ab676e5ed49d72b4.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.7
      },
      {
        game_code: "150",
        game_name: "Oriental Prosperity",
        game_img: "https://softapi2.shop/uploads/games/oriental-prosperity-23b43b58e11aadb1f27fd05ba41e9819.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.6
      },
      {
        game_code: "157",
        game_name: "Raider Jane's Crypt of Fortune",
        game_img: "https://softapi2.shop/uploads/games/raider-jane-s-crypt-of-fortune-24d8e1dbc5cface0907f5a21ecd56753.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.8
      },
      {
        game_code: "172",
        game_name: "Candy Burst",
        game_img: "https://softapi2.shop/uploads/games/candy-burst-27237d7e8d9b183c92fa9f6ab9832edc.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.5
      },
      {
        game_code: "6262",
        game_name: "Emperor Speed Baccarat B",
        game_img: "https://softapi2.shop/uploads/games/EmperorSpeedBaccaratA.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.9
      },
      {
        game_code: "6263",
        game_name: "Fan Tan",
        game_img: "https://softapi2.shop/uploads/games/fan_tan.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.7
      },
      {
        game_code: "354",
        game_name: "Jungle King",
        game_img: "https://softapi2.shop/uploads/games/jungle-king-4db0ec24ff55a685573c888efed47d7f.png",
        category: "Slots",
        providerId: "49",
        providerName: "JILI",
        rating: 4.5
      },
      {
        game_code: "357",
        game_name: "Go Goal Bingo",
        game_img: "https://softapi2.shop/uploads/games/go-goal-bingo-4e5ddaa644badc5f68974a65bf7af02a.png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.3
      },
      {
        game_code: "358",
        game_name: "Zeus",
        game_img: "https://softapi2.shop/uploads/games/zeus-4e7c9f4fbe9b5137f21ebd485a9cfa5c.png",
        category: "flash",
        providerId: "49",
        providerName: "JILI",
        rating: 4.6
      },
      {
        game_code: "775",
        game_name: "Hi Lo",
        game_img: "https://softapi2.shop/uploads/games/hi-lo-a669c993b0e1f1b7da100fcf95516bdf.png",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.3
      },
      {
        game_code: "826",
        game_name: "Hotline",
        game_img: "https://softapi2.shop/uploads/games/hotline-b31720b3cd65d917a1a96ef61a72b672.png",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.2
      },
      {
        game_code: "894",
        game_name: "Keno",
        game_img: "https://softapi2.shop/uploads/games/keno-c311eb4bbba03b105d150504931f2479.png",
        category: "flash",
        providerId: "57",
        providerName: "Spribe",
        rating: 4.1
      },
      {
        game_code: "140",
        game_name: "Phoenix Rises",
        game_img: "https://softapi2.shop/uploads/games/phoenix-rises-21c55c4cd28bb1ebf465fcfaf413477c.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.7
      },
      {
        game_code: "144",
        game_name: "Hood vs Wolf",
        game_img: "https://softapi2.shop/uploads/games/hood-vs-wolf-222ce90a04a2246eecd5216454f9792f.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.6
      },
      {
        game_code: "145",
        game_name: "Baccarat Deluxe",
        game_img: "https://softapi2.shop/uploads/games/baccarat-deluxe-22c3b8df172b40ac24a7e9c909e0e50e.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.8
      },
      {
        game_code: "175",
        game_name: "Buffalo Win",
        game_img: "https://softapi2.shop/uploads/games/buffalo-win-2818a7add6e10b2ec5f938d7ae0efb04.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.4
      },
      {
        game_code: "210",
        game_name: "Ninja vs Samurai",
        game_img: "https://softapi2.shop/uploads/games/ninja-vs-samurai-2eb712d4bb30e4594032ebf1464618b1.png",
        category: "Slots",
        providerId: "45",
        providerName: "PGSoft",
        rating: 4.7
      },
      {
        game_code: "6261",
        game_name: "French Roulette Gold",
        game_img: "https://softapi2.shop/uploads/games/french_roulette_gold.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.9
      },
      {
        game_code: "6264",
        game_name: "Speed Roulette",
        game_img: "https://softapi2.shop/uploads/games/speed_roulette.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.8
      },
      {
        game_code: "6265",
        game_name: "Blackjack VIP 12",
        game_img: "https://softapi2.shop/uploads/games/blackjack_vip_12.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.9
      },
      {
        game_code: "6266",
        game_name: "Blackjack VIP R",
        game_img: "https://softapi2.shop/uploads/games/blackjack_vip_r.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.8
      },
      {
        game_code: "6267",
        game_name: "Speed VIP Blackjack K",
        game_img: "https://softapi2.shop/uploads/games/blackjack_k.webp",
        category: "CasinoLive",
        providerId: "58",
        providerName: "Evolution Live",
        rating: 4.7
      },
      // REMOVED ONE GAME FROM THE END (Blackjack VIP J)
    ];
    setAllGames(allGamesData);

    // wallet summary
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/wallet/summary", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const balance = data.balance ?? data.walletBalance ?? 0;
        setUserBalance(balance);
        window.userBalance = balance;
      })
      .catch(() => setUserBalance(0));
  }, []);

  // announcement rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((p) => (p + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [announcements.length]);

  // hero slider rotate
  useEffect(() => {
    if (heroTimer.current) clearInterval(heroTimer.current);

    heroTimer.current = setInterval(() => {
      setHeroIndex((p) => (p + 1) % heroSlides.length);
    }, 5000);

    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current);
    };
  }, [heroSlides.length]);

  // Jackpot auto increment
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + Math.floor(Math.random() * 100));
      
      // Update digits without commas
      const newAmount = (jackpotAmount + Math.floor(Math.random() * 100)).toString();
      // Remove commas, just keep digits and dot
      const digits = newAmount.split('').filter(char => char !== ',');
      setJackpotDigits([...digits]);
    }, 3000);
    return () => clearInterval(interval);
  }, [jackpotAmount]);

  const scrollHotGames = (ref, direction) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;
    categoryScrollRef.current.scrollBy({
      left: direction === "left" ? -120 : 120,
      behavior: "smooth",
    });
  };

  const launchGame = (game) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("দয়া করে প্রথমে লগইন করুন");
      window.location.href = '/login';
      return;
    }

    localStorage.setItem('lastGameLaunched', JSON.stringify({
      name: game.game_name,
      code: game.game_code,
      provider: game.providerName,
      providerId: game.providerId,
      image: game.game_img,
      timestamp: new Date().toISOString()
    }));
    
    const embedUrl = `/casino/play/${game.game_code}?provider=${game.providerId}`;
    window.location.href = embedUrl;
  };

  const handleJoinCardRoom = () => {
    if (!joinRoomId.trim()) return alert("দয়া করে রুম আইডি দিন");
    onJoinCard(joinRoomId.trim());
    setOpenJoinPopup(false);
    setJoinRoomId("");
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId === "cards") {
      setOpenModal(true);
    } else if (categoryId === "ludo") {
      setShowLudoModal(true);
    } else {
      router.push("/casino");
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="w-full min-h-screen">
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-3 md:px-6 pb-10">

          {/* ===== HERO SLIDER ===== */}
          <div className="mt-3 md:mt-4">
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-xl h-[160px] sm:h-[180px] md:h-[220px] lg:h-[280px] xl:h-[320px]">
              {heroSlides.map((s, idx) => (
                <div
                  key={s.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === heroIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={s.img}
                    onError={(e) => (e.currentTarget.src = s.fallback)}
                    alt="hero"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Text only overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 lg:p-8">
                    <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 lg:mb-2">
                      {s.title}
                    </h1>
                    <p className="text-white/90 text-sm md:text-base lg:text-lg">
                      {s.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* ===== ANNOUNCEMENT BAR ===== */}
          <div className="pt-3 md:pt-4">
            <div className="w-full rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-white/10 px-4 py-2.5 lg:py-3 flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>

              <div className="relative h-5 md:h-6 lg:h-7 overflow-hidden flex-1">
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out"
                  style={{ transform: `translateY(-${announcementIndex * 100}%)` }}
                >
                  {announcements.map((msg, idx) => (
                    <div key={idx} className="h-5 md:h-6 lg:h-7 flex items-center">
                      <span className="text-white font-medium text-sm md:text-base">
                        {msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== JACKPOT BANNER ===== - FIXED FOR DESKTOP */}
          <div className="mt-3 md:mt-4 lg:mt-6">
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden border-0 h-[140px] md:h-[160px] lg:h-[200px] xl:h-[220px] group">
              <div className="absolute inset-0">
                <img 
                  src="/jackpot-img.jpg" 
                  alt="Jackpot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  onError={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8B0000 0%, #B22222 50%, #8B0008 100%)';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex items-end justify-center pb-8 md:pb-10 lg:pb-12 px-2">
                <div className="flex items-end justify-center gap-1 md:gap-2 lg:gap-3 w-full">
                  <div className="relative">
                    <div className="w-8 h-10 md:w-12 md:h-16 lg:w-16 lg:h-20 xl:w-20 xl:h-24 rounded-lg lg:rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-red-900 border-2 border-yellow-400/50 shadow-2xl shadow-red-900/60 flex items-center justify-center">
                      <span className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]">৳</span>
                    </div>
                    <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-red-600 blur-md opacity-40 -z-10"></div>
                  </div>
                  
                  <div className="flex items-end gap-1 md:gap-2 lg:gap-3">
                    {jackpotDigits.map((digit, idx) => (
                      <div key={idx} className="relative">
                        <div className={`
                          rounded-lg lg:rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-red-900 
                          border-2 border-yellow-400/50 shadow-2xl shadow-red-900/60
                          flex items-center justify-center
                          ${digit === '.' 
                            ? 'w-2 h-4 md:w-3 md:h-6 lg:w-4 lg:h-8 bg-yellow-400/80 border-yellow-400/60' 
                            : 'w-7 h-10 md:w-11 md:h-16 lg:w-14 lg:h-20 xl:w-16 xl:h-24'
                          }
                          transition-all duration-300 hover:scale-105
                        `}>
                          {digit === '.' ? (
                            <span className="text-sm md:text-base lg:text-lg font-black text-yellow-300">•</span>
                          ) : (
                            <span className="text-lg md:text-3xl lg:text-4xl xl:text-5xl font-black text-yellow-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                              {digit}
                            </span>
                          )}
                        </div>
                        
                        {digit !== '.' && (
                          <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-red-600 blur-md opacity-30 -z-10"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="absolute top-0 left-0 right-0 h-[2px] lg:h-[3px] bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] lg:h-[3px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
            </div>
          </div>

          {/* ===== SLIDABLE CATEGORY BUTTONS ===== - IMPROVED DESKTOP SIZE */}
          <div className="mt-4 md:mt-6 lg:mt-8">
            <div className="relative">
              <div
                ref={categoryScrollRef}
                className="flex gap-1.5 md:gap-2 lg:gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 -mx-1 px-1"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`
                      flex-shrink-0 w-[65px] h-[65px] md:w-[75px] md:h-[75px] lg:w-[90px] lg:h-[90px] xl:w-[100px] xl:h-[100px] rounded-xl lg:rounded-2xl
                      bg-gradient-to-br from-gray-900/80 to-black/80 
                      backdrop-blur-md border border-white/20 
                      p-1.5 md:p-2 lg:p-3 flex flex-col items-center justify-center gap-0.5 lg:gap-1
                      hover:scale-110 hover:shadow-2xl hover:border-white/30 
                      transition-all duration-300 active:scale-95
                      shadow-lg shadow-black/20
                    `}
                  >
                    <div className={`
                      w-8 h-8 md:w-9 md:h-9 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br ${cat.color} 
                      flex items-center justify-center text-white 
                      shadow-lg shadow-black/30
                      border border-white/20
                    `}>
                      {cat.icon}
                    </div>
                    <div className="text-white font-bold text-[10px] md:text-xs lg:text-sm text-center leading-tight mt-0.5 lg:mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {cat.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== WALLET SECTION ===== - USING LINK HREF */}
          <div className="mt-4 md:mt-6 lg:mt-8">
            <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4">
              <Link
                href="/deposit"
                className="group rounded-xl lg:rounded-2xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/20 p-2 md:p-3 lg:p-4 flex flex-col items-center justify-center gap-1 lg:gap-2 hover:border-pink-500/30 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-pink-500/20">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-white font-bold text-xs md:text-sm lg:text-base">ডিপোজিট</div>
              </Link>
              
              <Link
                href="/dashboard/withdraw"
                className="group rounded-xl lg:rounded-2xl bg-gradient-to-br from-pink-900/30 to-pink-800/20 border border-pink-500/20 p-2 md:p-3 lg:p-4 flex flex-col items-center justify-center gap-1 lg:gap-2 hover:border-purple-500/30 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/20">
                  <ArrowDownToLine className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-white font-bold text-xs md:text-sm lg:text-base">উইথড্র</div>
              </Link>
              
              <div className="rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 p-2 md:p-3 lg:p-4 flex flex-col items-center justify-center">
                <div className="text-white font-bold text-lg md:text-xl lg:text-2xl xl:text-3xl">
                  ৳ {userBalance ? formatNumber(userBalance / 100) : "০"}
                </div>
                <div className="text-white/70 text-xs md:text-sm lg:text-base">ব্যালেন্স</div>
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 animate-pulse mt-1 lg:mt-2"></div>
              </div>
            </div>
          </div>

          {/* ===== ALL GAMES TOGETHER - RESPONSIVE GRID ===== */}
          <div className="mt-6 md:mt-8 lg:mt-10">
            <div className="text-white font-bold text-lg md:text-xl lg:text-2xl mb-3 lg:mb-4">জনপ্রিয় গেমস</div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3 lg:gap-4">
              {allGames.map((game, index) => (
                <div
                  key={`game-${game.game_code}-${index}`}
                  onClick={() => launchGame(game)}
                  className="relative rounded-lg lg:rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:shadow-xl"
                >
                  <div className="relative w-full aspect-[3/4]">
                    <img
                      src={game.game_img}
                      alt={game.game_name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-1.5 left-1.5 lg:top-2 lg:left-2">
                      <div className="px-1.5 py-0.5 md:px-2 md:py-1 rounded-md lg:rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] md:text-xs lg:text-sm font-bold truncate max-w-[60px] md:max-w-[70px] lg:max-w-[80px]">
                        {game.providerName}
                      </div>
                    </div>
                    
                    <button className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-red-500/70 transition-colors z-10">
                      <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-white" />
                    </button>
                    
                    {game.providerId === "58" && (
                      <div className="absolute top-8 md:top-9 lg:top-10 right-1.5 lg:right-2 flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="text-white text-[10px] md:text-xs lg:text-sm font-bold">Live</div>
                      </div>
                    )}
                    
                    <div className="absolute top-8 md:top-9 lg:top-10 left-1.5 lg:left-2 hidden md:flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-[10px] md:text-xs lg:text-sm font-bold">{game.rating}</span>
                    </div>
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
                        <Play className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" fill="white" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 lg:p-3 bg-gradient-to-t from-yellow-700/90 via-amber-800/70 to-transparent">
                    <div className="text-white font-bold text-[10px] md:text-xs lg:text-sm text-center truncate drop-shadow-lg leading-tight">
                      {game.game_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => router.push("/casino")}
              className="w-full mt-4 md:mt-6 lg:mt-8 rounded-lg lg:rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-white/10 py-3 lg:py-4 text-white font-bold text-sm md:text-base lg:text-lg hover:border-pink-500/30 hover:bg-gradient-to-r hover:from-pink-500/30 hover:to-purple-600/30 transition-all duration-300 hover:scale-[1.02]"
            >
              সব গেমস দেখুন →
            </button>
          </div>

          {/* ===== RoyalsBet SECTION ===== */}
          <div className="mt-6 md:mt-8 lg:mt-10">
            <div className="text-center mb-3 md:mb-4 lg:mb-6">
              <div className="text-white font-bold text-lg md:text-xl lg:text-2xl">
                RoyalsBet Special
              </div>
              <div className="text-white/60 text-sm md:text-base lg:text-lg">
                মাল্টিপ্লেয়ার রুম তৈরি করুন ও খেলুন
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 lg:gap-8">
              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-white/10 group hover:scale-[1.02] transition-transform duration-200 hover:shadow-2xl">
                <div className="relative h-[120px] md:h-[160px] lg:h-[200px]">
                  <img
                    src="/images/room-card-img.png"
                    alt="কার্ড গেম"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 lg:top-6 lg:left-6">
                    <div className="px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs md:text-base lg:text-lg font-bold shadow-xl">
                      কার্ডস
                    </div>
                  </div>
                </div>
                <div className="p-3 md:p-4 lg:p-6">
                  <div className="text-white font-bold text-sm md:text-lg lg:text-xl mb-2 md:mb-3 lg:mb-4">কার্ড গেম রুম</div>
                  <div className="flex gap-2 md:gap-3 lg:gap-4">
                    <button
                      onClick={() => setOpenModal(true)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs md:text-sm lg:text-base font-bold py-2 md:py-3 lg:py-4 rounded-lg lg:rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02]"
                    >
                      তৈরি করুন
                    </button>
                    <button
                      onClick={() => setOpenJoinPopup(true)}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-xs md:text-sm lg:text-base font-bold py-2 md:py-3 lg:py-4 rounded-lg lg:rounded-xl hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]"
                    >
                      যোগ দিন
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border border-white/10 group hover:scale-[1.02] transition-transform duration-200 hover:shadow-2xl">
                <div className="relative h-[120px] md:h-[160px] lg:h-[200px]">
                  <img
                    src="/images/room-ludo-img.png"
                    alt="লুডো"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 lg:top-6 lg:left-6">
                    <div className="px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs md:text-base lg:text-lg font-bold shadow-xl">
                      লুডো
                    </div>
                  </div>
                </div>
                <div className="p-3 md:p-4 lg:p-6">
                  <div className="text-white font-bold text-sm md:text-lg lg:text-xl mb-2 md:mb-3 lg:mb-4">লুডো রুম</div>
                  <div className="flex gap-2 md:gap-3 lg:gap-4">
                    <button
                      onClick={() => setShowLudoModal(true)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs md:text-sm lg:text-base font-bold py-2 md:py-3 lg:py-4 rounded-lg lg:rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
                    >
                      তৈরি করুন
                    </button>
                    <button
                      onClick={() => setOpenLudoJoinPopup(true)}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-xs md:text-sm lg:text-base font-bold py-2 md:py-3 lg:py-4 rounded-lg lg:rounded-xl hover:border-blue-500/50 hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]"
                    >
                      যোগ দিন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== PREMIUM PROVIDERS SECTION ===== */}
          <div className="mt-10 md:mt-14 lg:mt-16">
            <div className="flex items-center justify-center mb-4 md:mb-6 lg:mb-8">
              <div className="w-8 md:w-12 lg:w-16 h-0.5 lg:h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              <h3 className="text-sm md:text-base lg:text-xl font-bold text-white mx-3 md:mx-4 lg:mx-6">
                প্রিমিয়াম প্রোভাইডার
              </h3>
              <div className="w-8 md:w-12 lg:w-16 h-0.5 lg:h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {casinoProviders.map((provider) => (
                <button
                  key={provider.brand_id}
                  onClick={() => router.push(`/casino/providers/${provider.brand_id}/games`)}
                  className={`group relative rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${provider.bgClass} ${provider.borderClass} aspect-[3/1] md:aspect-[16/9]`}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-3 md:p-4 lg:p-6">
                    <div className="w-full h-full flex items-center justify-center p-1 md:p-2 lg:p-3">
                      {provider.logo ? (
                        <img
                          src={provider.logo}
                          alt={provider.brand_title}
                          className="max-w-full max-h-10 md:max-h-14 lg:max-h-20 object-contain transition-transform duration-300 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="text-2xl md:text-3xl lg:text-4xl opacity-50">🎰</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white text-[10px] md:text-xs lg:text-sm text-center truncate font-medium">
                      {provider.brand_title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ===== GO TO CASINO CTA ===== */}
          <div className="text-center mt-10 md:mt-14 lg:mt-16 mb-6 md:mb-10 lg:mb-12">
            <div className="text-gray-300 text-sm md:text-base lg:text-lg mb-4 lg:mb-6">
              আরও ৫০০+ প্রিমিয়াম গেমসের জন্য
            </div>
            <button
              onClick={() => router.push("/casino")}
              className="inline-flex items-center gap-2 px-6 py-3 md:px-10 md:py-4 lg:px-12 lg:py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm md:text-base lg:text-lg font-bold hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
            >
              <span>পুরো ক্যাসিনো দেখুন</span>
              <span className="text-lg md:text-xl lg:text-2xl">→</span>
            </button>
          </div>
        </div>

        {/* ===== MODALS ===== */}
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
          onCreate={onCreateLudoRoom}
          userBalance={userBalance}
        />

        {/* ===== DEPOSIT MODAL ===== */}
        <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />

        {/* ===== WITHDRAW MODAL ===== */}
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

        {/* ===== JOIN CARD ROOM POPUP ===== */}
        {openJoinPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm bg-gradient-to-b from-purple-900/90 to-purple-800/90 rounded-xl border border-purple-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-base">কার্ড রুমে যোগ দিন</div>
                <button
                  onClick={() => setOpenJoinPopup(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="রুম আইডি দিন"
                className="w-full bg-purple-900/50 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />

              <div className="flex gap-2">
                <button
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-2 rounded-lg hover:shadow hover:shadow-emerald-500/10 transition-all"
                  onClick={handleJoinCardRoom}
                >
                  যোগ দিন
                </button>
                <button
                  className="flex-1 bg-purple-900/50 text-white font-bold py-2 rounded-lg border border-purple-500/20 hover:border-pink-500/30 transition-all"
                  onClick={() => setOpenJoinPopup(false)}
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== JOIN LUDO ROOM POPUP ===== */}
        {openLudoJoinPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm bg-gradient-to-b from-pink-900/90 to-pink-800/90 rounded-xl border border-pink-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-base">লুডো রুমে যোগ দিন</div>
                <button
                  onClick={() => setOpenLudoJoinPopup(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={ludoRoomId}
                onChange={(e) => setLudoRoomId(e.target.value)}
                placeholder="লুডো রুম আইডি দিন"
                className="w-full bg-pink-900/50 border border-pink-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              <div className="flex gap-2">
                <button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-2 rounded-lg hover:shadow hover:shadow-blue-500/10 transition-all"
                  onClick={() => {
                    if (!ludoRoomId.trim()) return;
                    onSetLudoRoomId(ludoRoomId.trim());
                    onJoinLudo();
                    setOpenLudoJoinPopup(false);
                    setLudoRoomId("");
                  }}
                >
                  যোগ দিন
                </button>
                <button
                  className="flex-1 bg-pink-900/50 text-white font-bold py-2 rounded-lg border border-pink-500/20 hover:border-blue-500/30 transition-all"
                  onClick={() => setOpenLudoJoinPopup(false)}
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}