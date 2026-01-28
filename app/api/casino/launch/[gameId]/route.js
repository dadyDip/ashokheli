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

export async function GET(request, { params }) {
  try {
    const gameId = params.gameId;
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider') || '49';
    
    console.log("=== NEW GAME LAUNCH API ===");
    console.log("Game ID:", gameId);
    console.log("Provider ID:", providerId);
    
    // 1. VERIFY AUTH TOKEN
    const auth = request.headers.get("authorization");
    
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized. No token provided." 
      }, { status: 401 });
    }
    
    const token = auth.split(" ")[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid or expired token" 
      }, { status: 401 });
    }
    
    const userId = decoded.id;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid token payload" 
      }, { status: 401 });
    }
    
    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: "Missing game ID"
      }, { status: 400 });
    }
    
    // 2. GET USER FROM DATABASE WITH CASINO ID
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
      return NextResponse.json({
        success: false,
        error: "User not found in database"
      }, { status: 404 });
    }
    
    if (!user.casinoId) {
      return NextResponse.json({
        success: false,
        error: "User does not have a casinoId assigned. Please contact support."
      }, { status: 400 });
    }
    
    if (user.isBanned) {
      return NextResponse.json({
        success: false,
        error: "Account is banned from playing"
      }, { status: 403 });
    }
    
    console.log(`User: ${user.firstName} ${user.lastName}`);
    console.log(`Casino ID: ${user.casinoId}`);
    console.log(`Balance: ${user.balance} paisa = ${user.balance / 100} taka`);
    
    // 3. CHECK IF USER HAS MINIMUM BALANCE
    const minimumBalancePaisa = 100; // 1 taka minimum
    if (user.balance < minimumBalancePaisa) {
      return NextResponse.json({
        success: false,
        error: "Insufficient balance to play casino games",
        userBalance: user.balance,
        userBalanceTaka: user.balance / 100,
        minimumRequired: minimumBalancePaisa,
        minimumRequiredTaka: minimumBalancePaisa / 100
      }, { status: 400 });
    }
    
    // 4. CREATE MATCH ID
    const matchId = `jili_${Date.now()}_${user.casinoId}_${gameId}`;
    
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
      
      console.log(`✅ Game session created: ${matchId}`);
      
    } catch (lockError) {
      console.error("Game session creation error:", lockError.message);
      return NextResponse.json({
        success: false,
        error: `Failed to create game session: ${lockError.message}`
      }, { status: 500 });
    }
    
    // 6. SEND AVAILABLE BALANCE TO iGamingAPIs
    const availableBalancePaisa = user.balance;
    const availableBalanceTaka = availableBalancePaisa / 100;
    
    console.log(`💰 Available balance sent: ${availableBalancePaisa} paisa = ${availableBalanceTaka} taka`);
    
    // 7. BUILD PAYLOAD FOR iGamingAPIs
    const gameUidValue = parseInt(gameId) || 0;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ferally-crispate-veda.ngrok-free.dev';
    
    // IMPORTANT: Return to our embed page, not redirect
    const returnUrl = `${baseUrl}/casino/return-game?matchId=${matchId}`;
    const callbackUrl = `${baseUrl}/api/casino/callback?matchId=${matchId}`;
    
    const payload = {
      user_id: user.casinoId,
      balance: parseFloat(availableBalanceTaka.toFixed(2)),
      game_uid: gameUidValue,
      token: JILI_TOKEN,
      timestamp: Date.now(),
      return: returnUrl,
      callback: callbackUrl,
      currency_code: 'BDT',
      language: 'en',
    };
    
    console.log("Payload to iGamingAPIs:", JSON.stringify(payload, null, 2));
    
    // 8. ENCRYPT PAYLOAD
    const encryptedPayload = encryptPayload(payload, JILI_SECRET);
    console.log("Encrypted payload length:", encryptedPayload.length);
    
    // 9. SEND TO iGamingAPIs
    const requestUrl = `${JILI_SERVER_URL}?payload=${encodeURIComponent(encryptedPayload)}&token=${JILI_TOKEN}`;
    
    console.log("Sending request to iGamingAPIs...");
    
    const response = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      timeout: 15000
    });
    
    const data = await response.json();
    console.log("iGamingAPIs Response:", data);
    
    // 10. HANDLE RESPONSE
    if (data.code === 0 && data.data?.url) {
      const gameUrl = data.data.url;
      
      // Store game session for tracking
      try {
        await prisma.gameSession.create({
          data: {
            sessionId: matchId,
            userId: user.id,
            gameCode: gameId,
            balance: availableBalanceTaka,
            provider: 'jili',
            brandId: providerId,
            status: 'launched',
          }
        });
        
        console.log("✅ Game session stored");
      } catch (sessionError) {
        console.error("Failed to store game session:", sessionError.message);
      }
      
      console.log("🎮 Game URL:", gameUrl);
      
      // Return JSON for embedding
      return NextResponse.json({
        success: true,
        url: gameUrl,
        matchId: matchId,
        casinoId: user.casinoId,
        gameCode: gameId,
        gameName: `JILI Game ${gameId}`,
        provider: 'JILI',
        userBalanceTaka: availableBalanceTaka,
        userBalancePaisa: availableBalancePaisa,
        embed: true,
        message: "Casino game launched successfully"
      });
      
    } else {
      // Clean up on failure
      await prisma.casinoGame.deleteMany({
        where: { matchId: matchId }
      });
      
      console.log("✅ Game session cleaned up due to launch failure");
      
      return NextResponse.json({
        success: false,
        error: data.msg || "iGamingAPIs failed to launch game",
        response: data,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("🚨 Game Launch Error:", error);
    
    // Clean up on any error
    try {
      const auth = request.headers.get("authorization");
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // Clean up any pending casino games
        await prisma.casinoGame.deleteMany({
          where: { 
            userId: userId,
            status: 'PLAYING',
            startedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
          }
        });
        
        console.log("✅ Emergency cleanup completed");
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup:", cleanupError);
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fix: [
        "Check JILI_SECRET is exactly 32 characters",
        "Verify NEXT_PUBLIC_BASE_URL is set",
        "Ensure casinoId exists for user",
      ]
    }, { status: 500 });
  }
}