// app/casino/play/[gameId]/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function PlayGamePage() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const launchGame = async () => {
      try {
        const gameId = params.gameId;
        const providerId = searchParams.get('provider') || '49';

        if (!gameId) {
          setError('Game ID is required');
          return;
        }

        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/casino');
          return;
        }

        // Call API to get game URL
        const response = await fetch(`/api/casino/launch/${gameId}?provider=${providerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success && data.url) {
          setGameData(data);
          localStorage.setItem('currentGameUrl', data.url);
        } else {
          setError(data.error || 'Failed to launch game');
        }
      } catch (err) {
        setError('Network error launching game');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    launchGame();
  }, [params.gameId, searchParams, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white text-sm md:text-base mt-2">Launching...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-xl md:text-2xl mb-2">⚠️</div>
          <div className="text-white text-sm md:text-base mb-3">{error}</div>
          <button
            onClick={() => router.push('/casino')}
            className="px-4 py-1.5 bg-[#4D2FB2] hover:bg-[#5A3BC0] rounded text-white text-xs font-medium"
          >
            Back to Casino
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fixed Arrow Button - ALWAYS 20% FROM LEFT */}
      <button
        onClick={() => setShowOverlay(!showOverlay)}
        className="fixed top-0 left-[20%] z-50 w-8 h-6 bg-[#4D2FB2] rounded-b-md flex items-center justify-center transition-all duration-200 hover:bg-[#5A3BC0] active:scale-95"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          transform: 'translateX(-50%)' // Centers the button on the 20% position
        }}
        aria-label={showOverlay ? "Hide controls" : "Show controls"}
      >
        <div 
          className={`text-white text-xs transition-transform duration-300 ${showOverlay ? 'rotate-180' : ''}`}
        >
          ↓
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
        {/* Background */}
        <div 
          className="w-full h-full"
          style={{
            backgroundColor: '#4D2FB2',
            backgroundImage: 'linear-gradient(to bottom, #4D2FB2, #3D2590)'
          }}
        >
          {/* Simple Nav Bar */}
          <div className="h-full flex items-center justify-between px-4 md:px-8">
            {/* Exit Button - Faded Red */}
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
              <span className="font-medium">{isMobile ? 'Reload' : 'Reload Page'}</span>
            </button>
          </div>

          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full h-screen">
        {gameData?.url ? (
          <iframe
            src={gameData.url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen *; accelerometer; gyroscope; payment"
            title="Casino Game"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            referrerPolicy="no-referrer-when-downgrade"
            scrolling={isMobile ? "no" : "auto"}
            style={{
              WebkitOverflowScrolling: 'touch'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Game URL not available</div>
          </div>
        )}
      </div>

      {/* Mobile Instruction - Fades after 3 seconds */}
      {isMobile && !showOverlay && (
        <div 
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-30 bg-black/80 backdrop-blur-sm rounded px-3 py-1 animate-pulse"
          style={{
            animation: 'fadeOut 3s forwards'
          }}
        >
          <div className="text-xs text-gray-300">Tap arrow for controls</div>
        </div>
      )}

      {/* Inline CSS */}
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
        }
      `}</style>
    </div>
  );
}