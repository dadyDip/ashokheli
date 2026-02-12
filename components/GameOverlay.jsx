// components/GameOverlay.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GameOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState('');
  const router = useRouter();

  // Auto-hide after 3 seconds, show on mouse move
  useEffect(() => {
    let hideTimeout;
    
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!isMenuOpen) setIsVisible(false);
      }, 3000);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(!isMenuOpen);
      }
    };

    // Get game URL from localStorage or query params
    const storedUrl = localStorage.getItem('currentGameUrl');
    if (storedUrl) setGameUrl(storedUrl);

    // Initial hide timeout
    hideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      clearTimeout(hideTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isMenuOpen]);

  // Handle exit game
  const handleExitGame = () => {
    // Store last game info
    localStorage.setItem('lastGameExit', new Date().toISOString());
    // Close or redirect
    if (window.opener) {
      window.close();
    } else {
      router.push('/casino');
    }
  };

  if (!isVisible && !isMenuOpen) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`fixed top-6 right-6 z-[99999] w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)',
          animation: 'float 3s ease-in-out infinite'
        }}
      >
        <div className={`text-white text-xl transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>
          ⚙️
        </div>
        
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping"></div>
      </button>

      {/* Overlay Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-24 right-6 w-80 bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-purple-900/50 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{animation: 'slideDown 0.3s ease-out'}}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <div className="text-white font-bold">Game Controls</div>
                    <div className="text-xs text-purple-300">RoyalsBet Casino</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link
                  href="/casino"
                  target="_blank"
                  className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-center transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="text-purple-400 text-lg mb-1">🎰</div>
                  <div className="text-white text-sm">Casino</div>
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-center transition-all"
                >
                  <div className="text-blue-400 text-lg mb-1">🔄</div>
                  <div className="text-white text-sm">Reload</div>
                </button>
              </div>

              {/* Exit Game Button */}
              <button
                onClick={handleExitGame}
                className="w-full p-4 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 border border-red-900/50 rounded-xl flex items-center justify-center gap-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-red-400 text-xl">✕</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">Exit Game</div>
                  <div className="text-xs text-red-300">Return to casino</div>
                </div>
              </button>
            </div>

            {/* Game Info */}
            {gameUrl && (
              <div className="p-4 border-t border-gray-800/50">
                <div className="text-xs text-gray-400 mb-2">Game URL</div>
                <div className="text-xs text-gray-300 truncate bg-gray-900/50 p-2 rounded">
                  {gameUrl.substring(0, 50)}...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}