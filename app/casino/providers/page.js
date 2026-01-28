// app/casino/providers/page.js - UPDATED
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('https://igamingapis.com/provider/brands.php');
        const data = await response.json();
        
        if (data.status) {
          // Filter for our main providers + add logos
          const mainProviders = data.brands
            .filter(brand => ["49", "45", "57", "58"].includes(brand.brand_id))
            .map(provider => ({
              ...provider,
              logo: provider.logo || getDefaultLogo(provider.brand_id)
            }));
          
          setProviders(mainProviders);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        // Fallback to static data
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
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, []);

  function getDefaultLogo(brandId) {
    const logos = {
      '49': 'https://softapi2.shop/uploads/brands/jili.png',
      '45': 'https://softapi2.shop/uploads/brands/pgsoft.png',
      '57': 'https://softapi2.shop/uploads/brands/spribe.png',
      '58': 'https://softapi2.shop/uploads/brands/brand_58_1759739497.png'
    };
    return logos[brandId] || '/default-brand.png';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading Providers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-black">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-6 py-3 rounded-full mb-6">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="text-sm font-semibold text-purple-300">GAME PROVIDERS</div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PROVIDERS
            </span>
          </h1>
          
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Premium gaming studios powering your casino experience
          </p>
        </div>

        {/* Providers Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {providers.map((provider) => (
              <Link
                key={provider.brand_id}
                href={`/casino/providers/${provider.brand_id}/games`}
                className="group relative rounded-3xl overflow-hidden
                  bg-gradient-to-b from-gray-900/40 to-gray-900/20
                  border border-gray-800 hover:border-purple-500/50
                  transition-all duration-500 hover:scale-[1.02]
                  hover:shadow-xl hover:shadow-purple-500/20
                  backdrop-blur-sm p-8"
              >
                {/* Provider Logo */}
                <div className="aspect-square relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                  {provider.logo ? (
                    <img
                      src={provider.logo}
                      alt={provider.brand_title}
                      className="relative w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="text-5xl">🎰</div>
                    </div>
                  )}
                </div>
                
                {/* Provider Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {provider.brand_title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Premium Games Collection
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                    <span className="text-sm font-medium">Explore Games</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                {/* ID Badge */}
                <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  ID: {provider.brand_id}
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}