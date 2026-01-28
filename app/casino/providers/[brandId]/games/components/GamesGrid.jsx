// app/casino/providers/[brandId]/games/components/GamesGrid.js - MATCHING CASINO PAGE DESIGN
"use client";

import { useState, useEffect } from "react";

const BRAND_LOGOS = {
  49: 'https://softapi2.shop/uploads/brands/jili.png',
  45: 'https://softapi2.shop/uploads/brands/pgsoft.png',
  57: 'https://softapi2.shop/uploads/brands/spribe.png',
  58: 'https://softapi2.shop/uploads/brands/brand_58_1759739497.png'
};

const BRAND_NAMES = {
  49: 'JILI',
  45: 'PGSoft',
  57: 'Spribe',
  58: 'Evolution Live'
};

const BRAND_BG_CLASSES = {
  49: "bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20",
  45: "bg-white",
  57: "bg-white",
  58: "bg-white"
};

const BRAND_BORDER_CLASSES = {
  49: "border border-yellow-500/30",
  45: "border border-purple-500/20",
  57: "border border-green-500/20",
  58: "border border-blue-500/20"
};

export default function GamesGrid({ brandId, games }) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const providerName = BRAND_NAMES[brandId] || `Provider ${brandId}`;
  const providerLogo = BRAND_LOGOS[brandId];
  const bgClass = BRAND_BG_CLASSES[brandId];
  const borderClass = BRAND_BORDER_CLASSES[brandId];

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
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
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, []);

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
  const filteredGames = games.filter(game =>
    game.game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading Premium Games...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated Neon Background - EXACT SAME AS CASINO PAGE */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-black to-purple-900/5"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600 rounded-full blur-[120px] animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[140px] animate-pulse delay-700 opacity-25"></div>
      </div>

      <div className="relative z-10">
        <div className="pt-4 pb-8 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Provider Header - EXACT SAME DESIGN AS CASINO PAGE */}
            <div className="mb-10 md:mb-14">
              <div className="flex items-center justify-center mb-6 md:mb-8">
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <h2 className="text-base md:text-lg font-bold text-white mx-3 md:mx-4">{providerName} Games</h2>
                <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              
              {/* Provider Info Card - Premium Design */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl p-3 md:p-4 ${bgClass} ${borderClass}`}>
                    {providerLogo ? (
                      <img
                        src={providerLogo}
                        alt={providerName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-2xl md:text-3xl">🎰</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      {providerName}
                    </h3>
                    <div className="text-gray-400 text-sm md:text-base mt-1">
                      {filteredGames.length} Premium Games
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Search - EXACT SAME DESIGN AS CASINO PAGE */}
            <div className="mb-8 md:mb-10">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder={`Search ${providerName} games...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-gray-900/50 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:shadow-lg focus:shadow-purple-500/20 backdrop-blur-sm"
                />
                <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-gray-500">
                  🔍
                </div>
              </div>
            </div>

            {/* Games Grid - EXACT SAME DESIGN AS CASINO PAGE */}
            {filteredGames.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎮</div>
                <div className="text-2xl text-gray-300 mb-2">No games found</div>
                <div className="text-gray-500">Try a different search term</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {filteredGames.map((game) => {
                  const gameImage = game.game_img || game.img || game.image;
                  const gameName = game.game_name || game.name;
                  
                  return (
                    <div
                      key={game.game_code}
                      onClick={() => launchGame(game)}
                      className="group relative transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {/* Square Card - EXACT SAME AS CASINO PAGE */}
                      <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 shadow-lg">
                        {/* Game Image */}
                        {gameImage ? (
                          <img
                            src={gameImage}
                            alt={gameName}
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
                            {gameName}
                          </div>
                        </div>
                        
                        {/* Play Overlay - EXACT SAME AS CASINO PAGE */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-purple-600/90 px-4 py-2 rounded-full text-white text-xs font-bold">
                            PLAY NOW
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back to Casino Button - Premium Design */}
            <div className="text-center mt-10 md:mt-14">
              <a
                href="/casino"
                className="inline-flex items-center gap-2 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm md:text-base font-bold hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
              >
                <span>← Back to Casino</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Launching Overlay - EXACT SAME AS CASINO PAGE */}
      {isLaunching && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-bold text-white">Launching Game...</div>
            <div className="text-gray-400 text-sm mt-2">Please wait</div>
          </div>
        </div>
      )}
    </div>
  );
}