// components/FloatingGameToggle.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingGameToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mouseOverToggle, setMouseOverToggle] = useState(false);
  const pathname = usePathname();

  // Only show on specific pages
  useEffect(() => {
    // Hide on these pages
    const hideOnPaths = [
      '/',
      '/login',
      '/register',
      '/casino/play',
      '/casino/launch-game',
      '/casino/game-wrapper',
      '/casino/return-game'
    ];
    
    // Check if current path starts with any hide path
    const shouldHide = hideOnPaths.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    );
    
    setIsVisible(!shouldHide);
  }, [pathname]);

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.game-toggle-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      // Auto-close after 5 seconds if mouse not over
      const timeout = setTimeout(() => {
        if (!mouseOverToggle) setIsOpen(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, mouseOverToggle]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] game-toggle-container">
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setMouseOverToggle(true)}
        onMouseLeave={() => setMouseOverToggle(false)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 relative group"
        style={{
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.8), 0 0 50px rgba(236, 72, 153, 0.4)',
          animation: 'pulse-glow 2s infinite'
        }}
      >
        {/* Arrow Icon */}
        <div 
          className={`text-white text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          style={{
            textShadow: '0 0 10px rgba(255,255,255,0.8)',
            filter: 'drop-shadow(0 0 8px rgba(168,85,247,1))'
          }}
        >
          {isOpen ? '↑' : '↓'}
        </div>
        
        {/* Neon Glow Ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(168,85,247,0.4), rgba(236,72,153,0.4), transparent)',
            animation: 'rotate 3s linear infinite',
            filter: 'blur(1px)'
          }}
        ></div>
        
        {/* Inner Glow */}
        <div 
          className="absolute inset-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0) 70%)',
            filter: 'blur(4px)'
          }}
        ></div>
      </button>

      {/* Dropdown Menu - Neon Slide Down */}
      <div 
        className={`absolute right-0 top-16 mt-2 w-72 bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-[-10px] pointer-events-none'
        }`}
        onMouseEnter={() => setMouseOverToggle(true)}
        onMouseLeave={() => setMouseOverToggle(false)}
        style={{
          boxShadow: '0 10px 40px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
      >
        {/* Neon Top Border */}
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #8B5CF6)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear'
          }}
        ></div>

        {/* Menu Content */}
        <div className="p-4">
          {/* Exit Game Button - Left Side */}
          <button
            onClick={() => window.location.href = '/casino'}
            className="w-full mb-3 p-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-lg flex items-center justify-between group transition-all duration-200"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
                }}
              >
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-white font-medium">Exit Game</div>
                <div className="text-xs text-gray-400">Return to casino</div>
              </div>
            </div>
          </button>

          {/* Reload Button - Right Side */}
          <button
            onClick={() => window.location.reload()}
            className="w-full p-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-lg flex items-center justify-between group transition-all duration-200"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-white font-medium">Reload Page</div>
                <div className="text-xs text-gray-400">Refresh current page</div>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Glow */}
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #8B5CF6)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear reverse'
          }}
        ></div>
      </div>

      {/* Inline CSS for animations */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 0 25px rgba(168, 85, 247, 0.8),
              0 0 50px rgba(236, 72, 153, 0.4);
          }
          50% {
            box-shadow: 
              0 0 35px rgba(168, 85, 247, 1),
              0 0 70px rgba(236, 72, 153, 0.6),
              0 0 100px rgba(236, 72, 153, 0.3);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .game-toggle-container {
          z-index: 99999;
        }
      `}</style>
    </div>
  );
}