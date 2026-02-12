// app/casino/play/[gameId]/page.jsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Wrapper component to handle suspense
function PlayGameContent() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('general'); // 'general', 'balance', 'network'
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [providerId, setProviderId] = useState('49');
  const [animationStep, setAnimationStep] = useState(0);
  
  const router = useRouter();
  
  // Animation effect
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 400);
    
    return () => clearInterval(interval);
  }, [loading]);
  
  // Extract gameId from URL on client side
  useEffect(() => {
    console.log("=== CLIENT-SIDE DEBUG ===");
    
    const extractFromURL = () => {
      const url = window.location.href;
      console.log("Current URL:", url);
      
      const patterns = [
        /\/casino\/play\/([^\/?]+)/,
        /\/play\/([^\/?]+)/,
        /gameId=([^&]+)/,
        /game=([^&]+)/,
        /code=([^&]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      const path = window.location.pathname;
      const parts = path.split('/');
      const playIndex = parts.indexOf('play');
      if (playIndex !== -1 && playIndex + 1 < parts.length) {
        return parts[playIndex + 1];
      }
      
      return null;
    };
    
    const extractFromStorage = () => {
      try {
        const lastGame = localStorage.getItem('lastGameLaunched');
        if (lastGame) {
          const gameInfo = JSON.parse(lastGame);
          return gameInfo.code || gameInfo.game_code || null;
        }
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }
      return null;
    };
    
    const extractFromSearchParams = () => {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('gameId') || searchParams.get('game') || searchParams.get('code');
    };
    
    const extractProviderId = () => {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('provider') || '49';
    };
    
    let extractedGameId = extractFromURL();
    
    if (!extractedGameId) {
      extractedGameId = extractFromStorage();
    }
    
    if (!extractedGameId) {
      extractedGameId = extractFromSearchParams();
    }
    
    if (extractedGameId) {
      console.log("✅ Extracted gameId:", extractedGameId);
      setGameId(extractedGameId);
    } else {
      console.error("❌ Could not extract gameId");
      setError("Game ID not found. Please launch the game again from the casino.");
      setLoading(false);
    }
    
    const extractedProviderId = extractProviderId();
    setProviderId(extractedProviderId);
    
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Launch game when gameId is available
  useEffect(() => {
    const launchGame = async () => {
      if (!gameId) return;
      
      console.log("=== LAUNCHING GAME ===");
      console.log("Game ID:", gameId);
      console.log("Provider ID:", providerId);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("No token found, redirecting to login");
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        
        // Check balance from localStorage first
        try {
          const user = JSON.parse(userStr);
          if (user.balance_taka < 10) { // Minimum 10 Taka to play
            setErrorType('balance');
            setError("You need at least ৳10 balance to play games");
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
        
        const apiUrl = `/api/casino/launch/${gameId}?provider=${providerId}`;
        console.log("📡 Calling API:", apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        console.log("API Response Status:", response.status);
        
        const data = await response.json();
        console.log("API Response Data:", data);
        
        if (data.success && data.url) {
          setGameData(data);
          localStorage.setItem('currentGameUrl', data.url);
          console.log("✅ Game launched successfully!");
          
          if (isMobile) {
            setTimeout(() => setShowOverlay(true), 500);
          }
        } else {
          const errorMsg = data.error || data.message || 'Failed to launch game';
          console.error("❌ API Error:", errorMsg);
          
          // Check for balance errors
          if (errorMsg.toLowerCase().includes('balance') || 
              errorMsg.toLowerCase().includes('insufficient') ||
              errorMsg.includes('লেনদেনের জন্য পর্যাপ্ত ব্যালেন্স নেই')) {
            setErrorType('balance');
          } else if (errorMsg.toLowerCase().includes('network') || 
                     errorMsg.toLowerCase().includes('connection') ||
                     errorMsg.toLowerCase().includes('timeout')) {
            setErrorType('network');
          }
          
          setError(errorMsg);
        }
      } catch (err) {
        console.error("🚨 Network error:", err);
        setErrorType('network');
        setError(`Network error: ${err.message}. Please check your connection.`);
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId) {
      launchGame();
    } else {
      const timer = setTimeout(() => {
        if (!gameId) {
          setError("Could not load game. Please go back to casino and try again.");
          setLoading(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [gameId, providerId, router, isMobile]);

  // Handle escape key to toggle overlay
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setShowOverlay(!showOverlay);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showOverlay]);

  // Handle back button
  useEffect(() => {
    const handleBackButton = (e) => {
      e.preventDefault();
      if (confirm('Exit game and return to casino?')) {
        router.push('/casino');
      }
    };
    
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [router]);

  // Loading Animation Component
  const LoadingAnimation = () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(77, 47, 178, ${Math.random() * 0.2}), transparent)`,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Joker Card Container */}
        <div className="relative mb-8">
          {/* Card Background */}
          <div className="w-40 h-56 md:w-48 md:h-64 rounded-2xl bg-gradient-to-br from-purple-900 via-black to-purple-900 border-2 border-purple-600 shadow-2xl shadow-purple-900/50">
            {/* Card Shine Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-white/5 to-transparent" />
            
            {/* Card Corners */}
            <div className="absolute top-4 left-4 text-2xl md:text-3xl text-red-500 font-bold">J</div>
            <div className="absolute bottom-4 right-4 text-2xl md:text-3xl text-red-500 font-bold transform rotate-180">J</div>
            
            {/* Center Joker Symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Crown */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-8 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-t-lg relative">
                    <div className="absolute -bottom-3 left-0 w-4 h-4 bg-yellow-400 transform rotate-45"></div>
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400 transform rotate-45"></div>
                    <div className="absolute -bottom-3 right-0 w-4 h-4 bg-yellow-400 transform rotate-45"></div>
                  </div>
                </div>
                
                {/* Joker Face */}
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden">
                  {/* Eyes */}
                  <div className="absolute top-6 left-6 w-6 h-8 bg-white rounded-full">
                    <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="absolute top-6 right-6 w-6 h-8 bg-white rounded-full">
                    <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                  </div>
                  
                  {/* Smile */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-8 border-b-4 border-white rounded-b-full"></div>
                  
                  {/* Hat Pompom */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Glowing Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          
          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatParticle ${Math.random() * 3 + 2}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* RoyalsBet Logo */}
        <div className="relative mb-12">
          <h1 className="text-4xl md:text-5xl font-bold italic tracking-wider">
            <span className="relative">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                animationStep === 0 ? 'from-purple-400 to-pink-600' :
                animationStep === 1 ? 'from-pink-400 to-blue-600' :
                animationStep === 2 ? 'from-blue-400 to-purple-600' :
                'from-green-400 to-yellow-600'
              } transition-all duration-500`}>
                RoyalsBet
              </span>
              <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 opacity-50 blur-sm">
                RoyalsBet
              </span>
            </span>
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        </div>
        
        {/* Loading Text with Animation */}
        <div className="text-center mb-8">
          <div className="text-xl md:text-2xl font-medium mb-4">
            <span className="relative">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                animationStep === 0 ? 'from-yellow-400 to-orange-500' :
                animationStep === 1 ? 'from-orange-400 to-red-500' :
                animationStep === 2 ? 'from-red-400 to-pink-500' :
                'from-pink-400 to-purple-500'
              } transition-all duration-500`}>
                Loading Game
              </span>
              <span className="absolute inset-0 text-white opacity-30 blur-sm">
                Loading Game
              </span>
            </span>
          </div>
          
          {/* Animated Dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className={`w-3 h-3 rounded-full transform transition-all duration-300 ${
                  animationStep % 4 === dot 
                    ? 'scale-125 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                    : 'scale-100 bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 md:w-80 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full transition-all duration-1000"
            style={{
              width: `${animationStep * 25}%`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
        
        {/* Loading Tips */}
        <div className="text-gray-400 text-sm text-center max-w-md">
          <div className="italic mb-2">"তাসের জাদু শুরু হতে আরও কিছুক্ষণ..."</div>
          <div className="text-xs">Game ID: <span className="text-purple-300">{gameId || '...'}</span></div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.8; }
          50% { transform: translateY(-15px) translateX(5px); opacity: 0.3; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes fadeOut {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </div>
  );

  // Error Component
  const ErrorDisplay = () => {
    const getErrorMessage = () => {
      switch (errorType) {
        case 'balance':
          return {
            title: "ব্যালেন্সের সমস্যা",
            message: "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।",
            instruction: "অনুগ্রহ করে আপনার অ্যাকাউন্টে টাকা ডিপোজিট করুন এবং আবার চেষ্টা করুন।",
            icon: "💰",
            color: "from-red-500 to-orange-500"
          };
        case 'network':
          return {
            title: "নেটওয়ার্ক সমস্যা",
            message: "ইন্টারনেট সংযোগে সমস্যা হচ্ছে।",
            instruction: "আপনার ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।",
            icon: "📡",
            color: "from-blue-500 to-cyan-500"
          };
        default:
          return {
            title: "দুঃখিত!",
            message: "গেম লোড করতে সমস্যা হচ্ছে।",
            instruction: "অনুগ্রহ করে গেমটি রিস্টার্ট করুন বা পরে আবার চেষ্টা করুন।",
            icon: "😔",
            color: "from-purple-500 to-pink-500"
          };
      }
    };

    const errorInfo = getErrorMessage();

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-90"></div>
          
          <div className="relative z-10">
            {/* Error Icon */}
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${errorInfo.color} flex items-center justify-center text-5xl shadow-2xl`}>
              {errorInfo.icon}
            </div>
            
            {/* Error Title */}
            <h2 className={`text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${errorInfo.color}`}>
              {errorInfo.title}
            </h2>
            
            {/* Error Message */}
            <div className="text-white text-lg font-medium mb-3">
              {errorInfo.message}
            </div>
            
            {/* Instruction */}
            <div className="text-gray-300 text-sm mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
              {errorInfo.instruction}
              {error && (
                <div className="mt-2 text-xs text-gray-400 font-mono p-2 bg-black/30 rounded">
                  {typeof error === 'string' && error.length > 100 ? error.substring(0, 100) + '...' : error}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-medium transition-all duration-300 active:scale-95 shadow-lg"
              >
                🔄 গেম রিস্টার্ট করুন
              </button>
              
              {errorType === 'balance' && (
                <button
                  onClick={() => router.push('/deposit')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-medium transition-all duration-300 active:scale-95"
                >
                  💰 ডিপোজিট করুন
                </button>
              )}
              
              <button
                onClick={() => router.push('/casino')}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-all duration-300 active:scale-95"
              >
                🎰 ক্যাসিনোতে ফিরে যান
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-white text-sm"
              >
                🏠 হোমপেজে ফিরে যান
              </button>
            </div>
            
            {/* Support Info */}
            <div className="mt-8 pt-4 border-t border-gray-800/50">
              <div className="text-gray-400 text-xs">
                সমস্যা থাকলে যোগাযোগ করুন:
              </div>
              <div className="text-gray-300 text-sm mt-1">
                📞 24/7 সাপোর্ট: 09678-123456
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorDisplay />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fixed Arrow Button */}
      <button
        onClick={() => setShowOverlay(!showOverlay)}
        className="fixed top-0 left-[20%] z-50 w-8 h-6 bg-[#4D2FB2] rounded-b-md flex items-center justify-center transition-all duration-200 hover:bg-[#5A3BC0] active:scale-95 group"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          transform: 'translateX(-50%)'
        }}
        aria-label={showOverlay ? "Hide controls" : "Show controls"}
      >
        <div 
          className={`text-white text-xs transition-transform duration-300 ${showOverlay ? 'rotate-180' : ''}`}
        >
          ↓
        </div>
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {showOverlay ? "Hide Controls" : "Show Controls"}
        </div>
      </button>

      {/* Overlay Panel */}
      <div 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
        style={{
          height: isMobile ? '50px' : '60px'
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            backgroundColor: '#4D2FB2',
            backgroundImage: 'linear-gradient(to bottom, #4D2FB2, #3D2590)'
          }}
        >
          <div className="h-full flex items-center justify-between px-4 md:px-8">
            {/* Exit Button */}
            <button
              onClick={() => {
                if (isMobile && !confirm('Exit game and return to casino?')) return;
                router.push('/casino');
              }}
              className={`flex items-center gap-2 text-white transition-all duration-200 hover:opacity-90 active:scale-95 ${
                isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              }`}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '6px'
              }}
            >
              <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded flex items-center justify-center`}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.25)'
                }}
              >
                <svg className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="font-medium">{isMobile ? 'Exit' : 'Exit Game'}</span>
            </button>

            {/* Game Info */}
            <div className="text-center">
              <div className="text-white text-xs md:text-sm font-medium truncate max-w-[120px] md:max-w-[200px]">
                {gameData?.gameName || 'Casino Game'}
              </div>
              <div className="text-white/70 text-[10px] md:text-xs">
                ব্যালেন্স: ৳{gameData?.userBalanceTaka?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* Reload Button */}
            <button
              onClick={() => window.location.reload()}
              className={`flex items-center gap-2 text-white transition-all duration-200 hover:opacity-90 active:scale-95 ${
                isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px'
              }}
            >
              <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded flex items-center justify-center`}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <svg className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="font-medium">{isMobile ? 'Reload' : 'গেম রিলোড'}</span>
            </button>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full h-screen pt-1">
        {gameData?.url ? (
          <iframe
            key={gameData.url}
            src={gameData.url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen *; accelerometer; gyroscope; payment; encrypted-media; picture-in-picture"
            title="Casino Game"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
            referrerPolicy="no-referrer-when-downgrade"
            scrolling={isMobile ? "no" : "auto"}
            style={{
              WebkitOverflowScrolling: 'touch',
              backgroundColor: '#000'
            }}
            onLoad={() => console.log("Game iframe loaded successfully")}
            onError={(e) => {
              console.error("Game iframe error:", e);
              setError("Game failed to load. Please restart.");
              setLoading(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="text-2xl mb-2">🎮</div>
              <div className="text-sm">Game loading...</div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Instruction */}
      {isMobile && !showOverlay && (
        <div 
          className="fixed top-12 left-1/2 transform -translate-x-1/2 z-30 bg-black/90 backdrop-blur-sm rounded-lg px-4 py-2 animate-pulse border border-purple-500/30"
          style={{
            animation: 'fadeOut 5s forwards'
          }}
        >
          <div className="text-xs text-white flex items-center gap-2">
            <span className="text-purple-400">↓</span>
            কন্ট্রোলের জন্য তীর ট্যাপ করুন
            <span className="text-purple-400">↓</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeOut {
          0%, 70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }
        
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          iframe {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
        }
      `}</style>
    </div>
  );
}

// Main component with Suspense
export default function PlayGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PlayGameContent />
    </Suspense>
  );
}