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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameCode = searchParams.get('gameCode');
    const brandId = searchParams.get('brandId') || '49';
    
    console.log("=== JILI LAUNCH (Authenticated) ===");
    console.log("Game Code:", gameCode);
    console.log("Brand ID:", brandId);
    
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
    
    if (!gameCode) {
      return NextResponse.json({
        success: false,
        error: "Missing gameCode parameter"
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
    console.log(`Casino ID: ${user.casinoId} (Type: ${typeof user.casinoId})`);
    console.log(`Balance: ${user.balance} paisa = ${user.balance / 100} taka`);
    
    // 3. FOR CASINO GAMES - NO FUND LOCKING
    const stakePaisa = 0; // No upfront stake for casino games
    const stakeTaka = 0;
    
    console.log("🎰 Casino game - No funds locked upfront. iGamingAPIs will handle per-spin betting.");
    
    // 4. CHECK IF USER HAS MINIMUM BALANCE (optional)
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
    
    // 5. CREATE MATCH ID
    const matchId = `jili_${Date.now()}_${user.casinoId}_${gameCode}`;
    
    // 6. CREATE CASINO GAME SESSION (NO FUND LOCKING)
    try {
      // Just create a game record, don't lock funds
      await prisma.casinoGame.create({
        data: {
          userId: user.id,
          gameType: `JILI_${gameCode}`,
          stake: 0, // No stake locked for casino games
          matchId: matchId,
          status: 'PLAYING',
          startedAt: new Date(),
        }
      });
      
      console.log(`✅ Casino game session created: ${matchId}`);
      console.log("💰 No funds locked - iGamingAPIs will manage balance internally");
      
    } catch (lockError) {
      console.error("Game session creation error:", lockError.message);
      return NextResponse.json({
        success: false,
        error: `Failed to create game session: ${lockError.message}`
      }, { status: 500 });
    }
    
    // 7. SEND FULL AVAILABLE BALANCE TO iGamingAPIs
    const availableBalancePaisa = user.balance; // Send FULL balance
    const availableBalanceTaka = availableBalancePaisa / 100;
    
    console.log(`💰 Available balance sent to iGamingAPIs: ${availableBalancePaisa} paisa = ${availableBalanceTaka} taka`);
    
    // 8. BUILD PAYLOAD FOR iGamingAPIs
    const gameUidValue = parseInt(gameCode) || 0;
    
    // Get base URL - IMPORTANT: Must be publicly accessible
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ferally-crispate-veda.ngrok-free.dev';
    
    // Create URLs - IMPORTANT: Point to our embedded return page
    const returnUrl = `${baseUrl}/casino/return-game?matchId=${matchId}`;
    const callbackUrl = `${baseUrl}/api/casino/callback?matchId=${matchId}`;
    
    console.log("Base URL:", baseUrl);
    console.log("Return URL:", returnUrl);
    console.log("Callback URL:", callbackUrl);
    
    // Validate URLs
    if (!returnUrl.startsWith('http') || !callbackUrl.startsWith('http')) {
      return NextResponse.json({
        success: false,
        error: "Invalid URL configuration. URLs must start with http:// or https://",
        returnUrl: returnUrl,
        callbackUrl: callbackUrl
      }, { status: 500 });
    }
    
    const payload = {
      user_id: user.casinoId, // NUMERIC casinoId
      balance: parseFloat(availableBalanceTaka.toFixed(2)), // Send FULL balance in taka
      game_uid: gameUidValue, // Numeric game code
      token: JILI_TOKEN,
      timestamp: Date.now(),
      return: returnUrl, // Changed to our embedded return page
      callback: callbackUrl,
      currency_code: 'BDT',
      language: 'en',
    };
    
    console.log("Payload to iGamingAPIs:", JSON.stringify(payload, null, 2));
    
    // 9. ENCRYPT PAYLOAD
    const encryptedPayload = encryptPayload(payload, JILI_SECRET);
    console.log("Encrypted payload length:", encryptedPayload.length);
    
    // 10. SEND TO iGamingAPIs
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
    
    // 11. HANDLE RESPONSE
    if (data.code === 0 && data.data?.url) {
      // Success - game launched
      const gameUrl = data.data.url;
      
      // Store game session for tracking - WITHOUT gameUrl field
      try {
        await prisma.gameSession.create({
          data: {
            sessionId: matchId,
            userId: user.id,
            gameCode: gameCode,
            balance: availableBalanceTaka,
            provider: 'jili',
            brandId: brandId,
            status: 'launched',
            // Remove gameUrl field if it doesn't exist in your schema
          }
        });
        
        console.log("✅ Game session stored");
      } catch (sessionError) {
        console.error("Failed to store game session:", sessionError.message);
        // Continue anyway - this isn't critical
      }
      
      console.log("🎮 Game URL:", gameUrl);
      
      // IMPORTANT: Return JSON with the game URL instead of redirecting
      return NextResponse.json({
        success: true,
        url: gameUrl,
        matchId: matchId,
        casinoId: user.casinoId,
        gameCode: gameCode,
        gameName: `JILI Game ${gameCode}`,
        provider: 'JILI',
        userBalanceTaka: availableBalanceTaka,
        userBalancePaisa: availableBalancePaisa,
        embed: true, // Flag indicating this should be embedded
        message: "Casino game launched successfully. Embed this URL in an iframe."
      });
      
    } else {
      // iGamingAPIs failed - clean up game session
      console.error("iGamingAPIs launch failed, cleaning up...");
      console.error("Error details:", JSON.stringify(data, null, 2));
      
      // Delete the casino game record
      await prisma.casinoGame.deleteMany({
        where: { matchId: matchId }
      });
      
      console.log("✅ Game session cleaned up due to launch failure");
      
      return NextResponse.json({
        success: false,
        error: data.msg || "iGamingAPIs failed to launch game",
        response: data,
        note: "No funds were locked. Game session cleaned up."
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("🚨 JILI Launch Error:", error);
    
    // Clean up on any error
    try {
      const auth = request.headers.get("authorization");
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const { searchParams } = new URL(request.url);
        const gameCode = searchParams.get('gameCode');
        
        // Clean up any pending casino games for this user in last 5 minutes
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      fix: [
        "1. Check JILI_SECRET is exactly 32 characters",
        "2. Verify NEXT_PUBLIC_BASE_URL is set to ngrok URL",
        "3. Ensure casinoId exists for user",
        "4. Check network connectivity to iGamingAPIs"
      ]
    }, { status: 500 });
  }
}