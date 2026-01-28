// app/casino/providers/page.js - COMPACT VERSION
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    setProviders([
      {
        brand_id: "49",
        brand_title: "JILI",
        logo: "https://softapi2.shop/uploads/brands/jili.png"
      },
      {
        brand_id: "45",
        brand_title: "PGSoft",
        logo: "https://softapi2.shop/uploads/brands/pgsoft.png"
      },
      {
        brand_id: "57",
        brand_title: "Spribe",
        logo: "https://softapi2.shop/uploads/brands/spribe.png"
      },
      {
        brand_id: "58",
        brand_title: "Evolution Live",
        logo: "https://softapi2.shop/uploads/brands/brand_58_1759739497.png"
      }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-purple-900/10"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Game Providers</h1>
            <div className="text-gray-400 text-sm">Premium gaming studios</div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {providers.map((provider) => (
              <Link
                key={provider.brand_id}
                href={`/casino/providers/${provider.brand_id}/games`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                {/* Provider Logo */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  {provider.logo ? (
                    <img
                      src={provider.logo}
                      alt={provider.brand_title}
                      className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <div className="text-3xl">🎰</div>
                  )}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Provider Name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-sm font-medium text-center">
                    {provider.brand_title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}