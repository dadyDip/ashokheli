// pages/casino/launch-game.jsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FloatingGameToggle from '@/components/FloatingGameToggle';

export default function GameLaunchPage() {
  const [gameUrl, setGameUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const launchGame = async () => {
      try {
        const gameCode = searchParams.get('gameCode');
        const brandId = searchParams.get('brandId');
        const userId = searchParams.get('userId');

        if (!gameCode || !brandId || !userId) {
          setError('Missing game parameters');
          return;
        }

        // Call your launch API
        const response = await fetch(
          `/api/casino/launch?userId=${userId}&gameCode=${gameCode}&brandId=${brandId}`
        );
        
        const data = await response.json();
        
        if (data.success && data.url) {
          setGameUrl(data.url);
        } else {
          setError('Failed to launch game');
        }
      } catch (err) {
        setError('Error launching game');
      } finally {
        setLoading(false);
      }
    };

    launchGame();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Launching game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
        <button 
          onClick={() => router.back()}
          className="ml-4 px-4 py-2 bg-purple-600 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with game controls */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm z-50 p-4 flex justify-between items-center border-b border-gray-700">
        <button
          onClick={() => router.push('/casino')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2"
        >
          ← Back to Casino
        </button>
        
        <div className="text-white text-sm">
          Playing: JILI Game
        </div>
      </div>

      {/* Game container */}
      <div className="pt-16 h-screen">
        <iframe
          src={gameUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen"
          title="Casino Game"
        />
      </div>

      {/* Floating toggle will show because we're on YOUR domain */}
      <FloatingGameToggle />
    </div>
  );
}