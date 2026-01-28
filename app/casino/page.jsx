// app/casino/page.js - UPDATED WITH DIRECT GAME LAUNCH
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CasinoPage() {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [providers, setProviders] = useState([]);
  const [gamesByProvider, setGamesByProvider] = useState({});
  const [loading, setLoading] = useState(true);
  const [bonusAmount, setBonusAmount] = useState(1010000);
  const [bonusWins, setBonusWins] = useState([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [user, setUser] = useState(null);

  // Static provider data with custom backgrounds
  const staticProviders = [
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

  // Featured games data (9 games)
  const staticFeaturedGames = [
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

  // Games by provider (9 games each)
  const staticGamesByProvider = {
    "49": [ // JILI
      {
        game_code: "581",
        game_name: "Super Ace Deluxe",
        game_img: "https://softapi2.shop/uploads/games/49[1].png",
        category: "flash",
        providerId: "49"
      },
      {
        game_code: "879",
        game_name: "Super Ace",
        game_img: "https://softapi2.shop/uploads/games/super-ace-bdfb23c974a2517198c5443adeea77a8.png",
        category: "Slots",
        providerId: "49"
      },
      {
        game_code: "709",
        game_name: "Wild Ace",
        game_img: "https://softapi2.shop/uploads/games/wild-ace-9a3b65e2ae5343df349356d548f3fc4b.png",
        category: "Slots",
        providerId: "49"
      },
      {
        game_code: "519",
        game_name: "Arena Fighter",
        game_img: "https://softapi2.shop/uploads/games/arena-fighter-71468f38b1fa17379231d50635990c31.png",
        category: "flash",
        providerId: "49"
      },
      {
        game_code: "354",
        game_name: "Jungle King",
        game_img: "https://softapi2.shop/uploads/games/jungle-king-4db0ec24ff55a685573c888efed47d7f.png",
        category: "Slots",
        providerId: "49"
      },
      {
        game_code: "357",
        game_name: "Go Goal Bingo",
        game_img: "https://softapi2.shop/uploads/games/go-goal-bingo-4e5ddaa644badc5f68974a65bf7af02a.png",
        category: "flash",
        providerId: "49"
      },
      {
        game_code: "358",
        game_name: "Zeus",
        game_img: "https://softapi2.shop/uploads/games/zeus-4e7c9f4fbe9b5137f21ebd485a9cfa5c.png",
        category: "flash",
        providerId: "49"
      },
      {
        game_code: "59",
        game_name: "Super Ace Scratch",
        game_img: "https://softapi2.shop/uploads/games/super-ace-scratch-0ec0aeb7aad8903bb6ee6b9b9460926a.png",
        category: "flash",
        providerId: "49"
      },
      {
        game_code: "925",
        game_name: "Mega Fishing",
        game_img: "https://softapi2.shop/uploads/games/mega-fishing-caacafe3f64a6279e10a378ede09ff38.png",
        category: "Fishing",
        providerId: "49"
      }
    ],
    "57": [ // Spribe
      {
        game_code: "737",
        game_name: "Aviator",
        game_img: "https://softapi2.shop/uploads/games/aviator-a04d1f3eb8ccec8a4823bdf18e3f0e84.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "426",
        game_name: "Mines",
        game_img: "https://softapi2.shop/uploads/games/mines.webp",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "478",
        game_name: "Plinko",
        game_img: "https://softapi2.shop/uploads/games/plinko-6ab7a4fe5161936012d6b06143918223.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "635",
        game_name: "Dice",
        game_img: "https://softapi2.shop/uploads/games/dice-8a87aae7a3624d284306e9c6fe1b3e9c.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "723",
        game_name: "Mini Roulette",
        game_img: "https://softapi2.shop/uploads/games/mini-roulette-9dc7ac6155c5a19c1cc204853e426367.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "775",
        game_name: "Hi Lo",
        game_img: "https://softapi2.shop/uploads/games/hi-lo-a669c993b0e1f1b7da100fcf95516bdf.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "826",
        game_name: "Hotline",
        game_img: "https://softapi2.shop/uploads/games/hotline-b31720b3cd65d917a1a96ef61a72b672.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "894",
        game_name: "Keno",
        game_img: "https://softapi2.shop/uploads/games/keno-c311eb4bbba03b105d150504931f2479.png",
        category: "flash",
        providerId: "57"
      },
      {
        game_code: "904",
        game_name: "Goal",
        game_img: "https://softapi2.shop/uploads/games/goal-c68a515f0b3b10eec96cf6d33299f4e2.png",
        category: "flash",
        providerId: "57"
      }
    ],
    "45": [ // PGSoft
      {
        game_code: "140",
        game_name: "Phoenix Rises",
        game_img: "https://softapi2.shop/uploads/games/phoenix-rises-21c55c4cd28bb1ebf465fcfaf413477c.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "144",
        game_name: "Hood vs Wolf",
        game_img: "https://softapi2.shop/uploads/games/hood-vs-wolf-222ce90a04a2246eecd5216454f9792f.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "145",
        game_name: "Baccarat Deluxe",
        game_img: "https://softapi2.shop/uploads/games/baccarat-deluxe-22c3b8df172b40ac24a7e9c909e0e50e.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "149",
        game_name: "Jungle Delight",
        game_img: "https://softapi2.shop/uploads/games/jungle-delight-232e8e0c74f9bb16ab676e5ed49d72b4.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "150",
        game_name: "Oriental Prosperity",
        game_img: "https://softapi2.shop/uploads/games/oriental-prosperity-23b43b58e11aadb1f27fd05ba41e9819.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "157",
        game_name: "Raider Jane's Crypt of Fortune",
        game_img: "https://softapi2.shop/uploads/games/raider-jane-s-crypt-of-fortune-24d8e1dbc5cface0907f5a21ecd56753.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "172",
        game_name: "Candy Burst",
        game_img: "https://softapi2.shop/uploads/games/candy-burst-27237d7e8d9b183c92fa9f6ab9832edc.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "175",
        game_name: "Buffalo Win",
        game_img: "https://softapi2.shop/uploads/games/buffalo-win-2818a7add6e10b2ec5f938d7ae0efb04.png",
        category: "Slots",
        providerId: "45"
      },
      {
        game_code: "210",
        game_name: "Ninja vs Samurai",
        game_img: "https://softapi2.shop/uploads/games/ninja-vs-samurai-2eb712d4bb30e4594032ebf1464618b1.png",
        category: "Slots",
        providerId: "45"
      }
    ],
    "58": [ // Evolution Live
      {
        game_code: "6261",
        game_name: "French Roulette Gold",
        game_img: "https://softapi2.shop/uploads/games/french_roulette_gold.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6262",
        game_name: "Emperor Speed Baccarat B",
        game_img: "https://softapi2.shop/uploads/games/EmperorSpeedBaccaratA.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6263",
        game_name: "Fan Tan",
        game_img: "https://softapi2.shop/uploads/games/fan_tan.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6264",
        game_name: "Speed Roulette",
        game_img: "https://softapi2.shop/uploads/games/speed_roulette.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6265",
        game_name: "Blackjack VIP 12",
        game_img: "https://softapi2.shop/uploads/games/blackjack_vip_12.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6266",
        game_name: "Blackjack VIP R",
        game_img: "https://softapi2.shop/uploads/games/blackjack_vip_r.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6267",
        game_name: "Speed VIP Blackjack K",
        game_img: "https://softapi2.shop/uploads/games/blackjack_k.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6268",
        game_name: "Speed VIP Blackjack J",
        game_img: "https://softapi2.shop/uploads/games/blackjack_vip_j.webp",
        category: "CasinoLive",
        providerId: "58"
      },
      {
        game_code: "6269",
        game_name: "Speed Blackjack E",
        game_img: "https://softapi2.shop/uploads/games/speed_blackjack_e.webp",
        category: "CasinoLive",
        providerId: "58"
      }
    ]
  };

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/wallet/summary', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };

    // Simulate loading
    const timer = setTimeout(() => {
      setFeaturedGames(staticFeaturedGames);
      setProviders(staticProviders);
      setGamesByProvider(staticGamesByProvider);
      setLoading(false);
    }, 800);

    // Bonus counter animation
    let currentAmount = 1010000;
    const incrementInterval = setInterval(() => {
      currentAmount += 10;
      setBonusAmount(currentAmount);
    }, 1000);

    checkUser();

    return () => {
      clearTimeout(timer);
      clearInterval(incrementInterval);
    };
  }, []);

  // Updated game launch functions
  const launchGame = async (game) => {
    if (!user) {
      alert("Please login first to play casino games");
      window.location.href = '/login';
      return;
    }

    setIsLaunching(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Store game info
      localStorage.setItem('lastGameLaunched', JSON.stringify({
        name: game.name,
        code: game.game_code,
        provider: game.provider,
        providerId: game.providerId,
        image: game.image_url,
        timestamp: new Date().toISOString()
      }));
      
      // Redirect to our embed page (not opening new tab)
      const embedUrl = `/casino/play/${game.game_code}?provider=${game.providerId}`;
      window.location.href = embedUrl; // Redirect current page
      
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setIsLaunching(false);
    }
  };

  // For direct launches (no modal)
  const launchGameDirectly = async (game) => {
    if (!user) {
      alert("Please login first to play casino games");
      window.location.href = '/login';
      return;
    }

    setIsLaunching(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Store game info
      localStorage.setItem('lastGameLaunched', JSON.stringify({
        name: game.name,
        code: game.game_code,
        provider: game.provider,
        providerId: game.providerId,
        image: game.image_url,
        timestamp: new Date().toISOString()
      }));
      
      // Redirect to our embed page (not opening new tab)
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

  // Quick play handler
  const handleGameClick = (game) => {
    setSelectedGame(game);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading Premium Casino...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated Neon Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-black to-purple-900/5"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600 rounded-full blur-[120px] animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[140px] animate-pulse delay-700 opacity-25"></div>
      </div>

      <div className="relative z-10">
        <div className="pt-4 pb-8 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Casino Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  CASINO
                </span>
              </h1>
            </div>

            {/* SECTION 1: Featured Games */}
            <div className="mb-10 md:mb-14">
              <div className="flex items-center justify-center mb-6 md:mb-8">
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <h2 className="text-base md:text-lg font-bold text-white mx-3 md:mx-4">Featured Games</h2>
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              
              {/* Mobile: 3 per row, Desktop: 5 per row */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {featuredGames.map((game) => (
                  <div
                    key={game.game_code}
                    onClick={() => launchGameDirectly(game)} // CHANGE HERE
                    className="group relative transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    {/* Square Card Container */}
                    <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 shadow-lg">
                      {/* Game Image */}
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
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70"></div>
                      
                      {/* Game Name Badge */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <div className="text-white text-xs md:text-sm font-medium truncate text-center">
                          {game.game_name}
                        </div>
                      </div>
                      
                      {/* Play Overlay - KEEP THIS FOR VISUAL FEEDBACK */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-600/90 px-4 py-2 rounded-full text-white text-xs font-bold">
                          PLAY NOW
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: Live Wins Counter */}
            <div className="mb-10 md:mb-14 h-36 md:h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/30 via-yellow-800/40 to-yellow-900/30 rounded-xl md:rounded-2xl border-2 border-yellow-600/40 backdrop-blur-sm overflow-hidden">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-shine"></div>
                
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6">
                  {/* Title */}
                  <div className="text-yellow-300 text-sm md:text-base font-bold tracking-widest uppercase mb-2 md:mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    Live Wins Counter
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Main Counter */}
                  <div className="text-2xl md:text-4xl lg:text-5xl font-black text-yellow-200 font-mono tracking-wider mb-1 md:mb-2">
                    ৳ {formatNumber(bonusAmount)}
                  </div>
                  
                  {/* Subtitle */}
                  <div className="text-yellow-500/70 text-xs md:text-sm font-medium">
                    Increasing every second +৳10
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Premium Providers (Landscape Cards) */}
            <div className="mb-10 md:mb-14">
              <div className="flex items-center justify-center mb-6 md:mb-8">
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <h2 className="text-base md:text-lg font-bold text-white mx-3 md:mx-4">Premium Providers</h2>
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              
              {/* Landscape Cards - width > height */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {providers.map((provider) => (
                  <Link
                    key={provider.brand_id}
                    href={`/casino/providers/${provider.brand_id}/games`}
                    className={`group relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${provider.bgClass} ${provider.borderClass}`}
                  >
                    {/* Landscape Container - Mobile: 40% shorter, Desktop: Same height */}
                    <div className="aspect-[3/1] md:aspect-[16/9] flex items-center justify-center p-3 md:p-6">
                      {/* Provider Logo */}
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
                    
                    {/* Provider Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-white text-xs md:text-base font-bold text-center">
                        {provider.brand_title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* SECTION 4: Provider Game Sections */}
            {providers.map((provider) => (
              <div key={provider.brand_id} className="mb-10 md:mb-14">
                {/* Provider Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl p-2 md:p-3 ${provider.bgClass} ${provider.borderClass}`}>
                      {provider.logo ? (
                        <img
                          src={provider.logo}
                          alt={provider.brand_title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-lg md:text-xl">🎰</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        {provider.brand_title}
                      </h3>
                      <div className="text-xs md:text-sm text-gray-400">Premium Games</div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/casino/providers/${provider.brand_id}/games`}
                    className="text-xs md:text-sm text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-purple-500/10"
                  >
                    View All →
                  </Link>
                </div>

                {/* Games Grid - Mobile: 3 per row, Desktop: 5 per row */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                  {gamesByProvider[provider.brand_id]?.map((game) => (
                    <div
                      key={game.game_code}
                      onClick={() => launchGameDirectly({...game, providerId: provider.brand_id})} 
                      className="group relative transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {/* Square Card */}
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
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        
                        {/* Game Name */}
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-gradient-to-t from-black/90 to-transparent">
                          <div className="text-white text-xs md:text-sm font-medium truncate text-center">
                            {game.game_name}
                          </div>
                        </div>
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-purple-600/90 px-4 py-2 rounded-full text-white text-xs font-bold">
                            PLAY NOW
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* View All Button */}
            <div className="text-center mt-10 md:mt-14">
              <Link
                href="/casino/providers"
                className="inline-flex items-center gap-2 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm md:text-base font-bold hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
              >
                <span>Explore All Games</span>
                <span className="text-lg md:text-xl">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Game Launch Modal */}
      {selectedGame && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedGame(null)}
        >
          <div 
            className="bg-gradient-to-b from-gray-900 to-black rounded-2xl max-w-sm w-full border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedGame.game_name}
                  </h2>
                  <div className="text-sm text-purple-400 mt-1">
                    {selectedGame.providerName || staticProviders.find(p => p.brand_id === selectedGame.providerId)?.brand_title}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="aspect-video relative bg-gray-900 rounded-xl mb-4 flex items-center justify-center">
                {selectedGame.game_img ? (
                  <img
                    src={selectedGame.game_img}
                    alt={selectedGame.game_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-5xl">🎮</div>
                )}
              </div>
              
              <div className="space-y-4">
                {user ? (
                  <button
                    onClick={() => launchGame(selectedGame)}
                    disabled={isLaunching}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLaunching ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Launching Game...
                      </>
                    ) : (
                      <>
                        <span>🎮</span>
                        <span>PLAY NOW</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
                  >
                    Login to Play
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedGame(null)}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
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