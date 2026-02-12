// app/api/casino/launch/[gameId]/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '@/server/prisma';

const JILI_TOKEN = "73b16eef2a0284be52da708883e0180f";
const JILI_SECRET = process.env.JILI_SECRET || "41cbb6f2aceeff62d7ea0a7e96031a3b";
const JILI_SERVER_URL = "https://igamingapis.live/api/v1";

function encryptPayload(payload, secretKey) {
  if (!secretKey || secretKey.length !== 32) {
    throw new Error(`JILI_SECRET must be 32 characters. Got: ${secretKey?.length || 0}`);
  }
  
  const json = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-ecb', Buffer.from(secretKey), null);
  cipher.setAutoPadding(true);
  
  let encrypted = cipher.update(json, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return encrypted;
}

// Add CORS headers function
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(request, { params }) {
  try {
    console.log("=== CASINO LAUNCH API CALLED ===");
    
    // FIX 1: AWAIT PARAMS FOR NEXT.JS 15
    const resolvedParams = await params;
    let gameId = resolvedParams?.gameId;
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider') || '49';
    
    // Debug logging
    console.log("Resolved params:", resolvedParams);
    console.log("Game ID from params:", gameId);
    console.log("Provider ID:", providerId);
    console.log("Full URL:", request.url);
    
    // Fallback: check URL path
    if (!gameId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const launchIndex = pathParts.findIndex(part => part === 'launch');
      if (launchIndex !== -1 && launchIndex + 1 < pathParts.length) {
        gameId = pathParts[launchIndex + 1];
        console.log("Extracted gameId from URL path:", gameId);
      }
    }
    
    if (!gameId) {
      console.error("❌ Missing gameId in API");
      return addCorsHeaders(
        NextResponse.json({ 
          success: false, 
          error: "Missing game ID parameter" 
        }, { status: 400 })
      );
    }
    
    // 1. VERIFY AUTH TOKEN
    const auth = request.headers.get("authorization");
    console.log("Auth header present:", !!auth);
    
    if (!auth || !auth.startsWith("Bearer ")) {
      return addCorsHeaders(
        NextResponse.json({ 
          success: false, 
          error: "Unauthorized. No token provided.",
          fix: "Please login again"
        }, { status: 401 })
      );
    }
    
    const token = auth.split(" ")[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully, user ID:", decoded.id);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return addCorsHeaders(
        NextResponse.json({ 
          success: false, 
          error: "Invalid or expired token",
          message: err.message
        }, { status: 401 })
      );
    }
    
    const userId = decoded.id;
    
    if (!userId) {
      return addCorsHeaders(
        NextResponse.json({ 
          success: false, 
          error: "Invalid token payload - no user ID found" 
        }, { status: 401 })
      );
    }
    
    // 2. GET USER FROM DATABASE
    console.log("Fetching user from database...");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        casinoId: true,
        firstName: true, 
        lastName: true, 
        balance: true,
        isBanned: true,
        phone: true
      }
    });
    
    if (!user) {
      console.error("User not found for ID:", userId);
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "User not found in database"
        }, { status: 404 })
      );
    }
    
    console.log(`User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
    console.log(`Casino ID: ${user.casinoId}`);
    console.log(`Balance: ${user.balance} paisa = ${user.balance / 100} taka`);
    
    if (!user.casinoId) {
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "User does not have a casino account. Please contact support."
        }, { status: 400 })
      );
    }
    
    if (user.isBanned) {
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "Account is temporarily suspended from playing"
        }, { status: 403 })
      );
    }
    
    // 3. CHECK BALANCE
    const minimumBalancePaisa = 100; // 1 taka minimum
    if (user.balance < minimumBalancePaisa) {
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "Insufficient balance to play casino games",
          userBalance: user.balance,
          userBalanceTaka: (user.balance / 100).toFixed(2),
          minimumRequired: minimumBalancePaisa,
          minimumRequiredTaka: (minimumBalancePaisa / 100).toFixed(2),
          action: "Please deposit funds"
        }, { status: 400 })
      );
    }
    
    // 4. CREATE MATCH ID
    const matchId = `jili_${Date.now()}_${user.casinoId}_${gameId}`;
    console.log(`Generated Match ID: ${matchId}`);
    
    // 5. CREATE CASINO GAME SESSION
    try {
      await prisma.casinoGame.create({
        data: {
          userId: user.id,
          gameType: `JILI_${gameId}`,
          stake: 0,
          matchId: matchId,
          status: 'PLAYING',
          startedAt: new Date(),
        }
      });
      
      console.log(`✅ Game session created in database`);
      
    } catch (lockError) {
      console.error("Database error creating game session:", lockError.message);
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: `Database error: ${lockError.message}`,
          fix: "Please try again"
        }, { status: 500 })
      );
    }
    
    // 6. PREPARE PAYLOAD FOR iGamingAPIs
    const availableBalancePaisa = user.balance;
    const availableBalanceTaka = availableBalancePaisa / 100;
    
    console.log(`💰 User balance: ${availableBalancePaisa} paisa (${availableBalanceTaka.toFixed(2)} taka)`);
    
    const gameUidValue = parseInt(gameId) || 0;
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ashokheli.top';
    console.log("Using base URL:", baseUrl);
    
    // Create URLs
    const returnUrl = `${baseUrl}/casino/return-game?matchId=${matchId}`;
    const callbackUrl = `${baseUrl}/api/casino/callback?matchId=${matchId}`;
    
    console.log("Return URL:", returnUrl);
    console.log("Callback URL:", callbackUrl);
    
    const payload = {
      user_id: parseInt(user.casinoId),
      balance: parseFloat(availableBalanceTaka.toFixed(2)),
      game_uid: gameUidValue,
      token: JILI_TOKEN,
      timestamp: Date.now(),
      return: returnUrl,
      callback: callbackUrl,
      currency_code: 'BDT',
      language: 'en',
      brand_id: parseInt(providerId) || 49
    };
    
    console.log("📦 Payload to iGamingAPIs:", JSON.stringify(payload, null, 2));
    
    // 7. ENCRYPT PAYLOAD
    let encryptedPayload;
    try {
      encryptedPayload = encryptPayload(payload, JILI_SECRET);
      console.log("✅ Payload encrypted, length:", encryptedPayload.length);
    } catch (encryptError) {
      console.error("Encryption error:", encryptError.message);
      // Clean up game session
      await prisma.casinoGame.deleteMany({ where: { matchId: matchId } });
      
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "Encryption failed",
          details: encryptError.message,
          fix: "Check JILI_SECRET environment variable (must be 32 chars)"
        }, { status: 500 })
      );
    }
    
    // 8. SEND TO iGamingAPIs
    const requestUrl = `${JILI_SERVER_URL}?payload=${encodeURIComponent(encryptedPayload)}&token=${JILI_TOKEN}`;
    console.log("🌐 Sending to iGamingAPIs:", requestUrl);
    
    let apiResponse;
    try {
      const response = await fetch(requestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      apiResponse = await response.json();
      console.log("iGamingAPIs Response:", JSON.stringify(apiResponse, null, 2));
      
    } catch (fetchError) {
      console.error("Network error contacting iGamingAPIs:", fetchError.message);
      
      // Clean up
      await prisma.casinoGame.deleteMany({ where: { matchId: matchId } });
      
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: "Cannot connect to game server",
          details: fetchError.message,
          fix: "Please check your internet connection and try again"
        }, { status: 503 })
      );
    }
    
    // 9. HANDLE RESPONSE
    if (apiResponse.code === 0 && apiResponse.data?.url) {
      const gameUrl = apiResponse.data.url;
      console.log("🎮 Game URL received:", gameUrl);
      
      // Store game session for tracking - FIX 2: REMOVED gameUrl FIELD
      try {
        await prisma.gameSession.create({
          data: {
            sessionId: matchId,
            userId: user.id,
            gameCode: gameId.toString(),
            balance: availableBalanceTaka,
            provider: 'jili',
            brandId: providerId,
            status: 'launched'
            // Removed: gameUrl: gameUrl - field doesn't exist in schema
          }
        });
        
        console.log("✅ Game session stored in database");
      } catch (sessionError) {
        console.error("Failed to store game session (non-critical):", sessionError.message);
        // Continue anyway
      }
      
      // Return success response
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          url: gameUrl,
          matchId: matchId,
          casinoId: user.casinoId,
          gameCode: gameId,
          gameName: `Game ${gameId}`,
          provider: 'JILI',
          userBalanceTaka: availableBalanceTaka,
          userBalancePaisa: availableBalancePaisa,
          providerId: providerId,
          embed: true,
          message: "Game launched successfully",
          timestamp: new Date().toISOString()
        })
      );
      
    } else {
      // iGamingAPIs failed
      console.error("iGamingAPIs launch failed:", apiResponse.msg || "Unknown error");
      
      // Clean up game record
      await prisma.casinoGame.deleteMany({ where: { matchId: matchId } });
      
      console.log("✅ Game session cleaned up");
      
      return addCorsHeaders(
        NextResponse.json({
          success: false,
          error: apiResponse.msg || "Game server rejected the request",
          response: apiResponse,
          fix: "Please try a different game or contact support"
        }, { status: 500 })
      );
    }
    
  } catch (error) {
    console.error("🚨 UNEXPECTED ERROR:", error);
    console.error("Stack:", error.stack);
    
    // Emergency cleanup
    try {
      const auth = request.headers.get("authorization");
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // Clean up any pending games from last 10 minutes
        await prisma.casinoGame.deleteMany({
          where: { 
            userId: userId,
            status: 'PLAYING',
            startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
          }
        });
        
        console.log("✅ Emergency cleanup completed");
      }
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    
    return addCorsHeaders(
      NextResponse.json({
        success: false,
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        fix: [
          "1. Check server logs",
          "2. Verify database connection",
          "3. Check environment variables",
          "4. Contact support if problem persists"
        ]
      }, { status: 500 })
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}