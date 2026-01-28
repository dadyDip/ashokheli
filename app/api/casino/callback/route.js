import { NextResponse } from 'next/server';
import prisma from '@/server/prisma';

// Simple cache to track processed rounds
const processedRounds = new Set();

export async function POST(request) {
  console.log('⚡ WORKING CALLBACK WITH UPDATES');
  
  try {
    // 1. Get body
    const body = await request.json();
    
    const memberAccount = body.member_account || '1000';
    const betAmount = parseFloat(body.bet_amount) || 0;
    const winAmount = parseFloat(body.win_amount) || 0;
    const gameRound = body.game_round || '';
    const casinoId = parseInt(memberAccount);
    
    // 2. Get user current balance
    const user = await prisma.user.findFirst({
      where: { casinoId: casinoId },
      select: { id: true, balance: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({
        credit_amount: 999.99,
        timestamp: Date.now()
      });
    }
    
    // 3. Calculate new balance
    const betPaisa = Math.round(betAmount * 100);
    const winPaisa = Math.round(winAmount * 100);
    const netChange = winPaisa - betPaisa;
    const newBalancePaisa = user.balance + netChange;
    
    // Calculate credit_amount from NEW balance
    const creditAmount = parseFloat((newBalancePaisa / 100).toFixed(2));
    
    console.log(`📤 Sending credit_amount = ${creditAmount}`);
    
    // 4. Send response IMMEDIATELY
    const response = NextResponse.json({
      credit_amount: creditAmount,
      timestamp: Date.now()
    });
    
    // 5. Update database AFTER sending response (async, doesn't block)
    if (!processedRounds.has(gameRound)) {
      processedRounds.add(gameRound);
      
      // Start update without awaiting
      updateDatabase({
        userId: user.id,
        gameRound: gameRound,
        betPaisa: betPaisa,
        winPaisa: winPaisa,
        netChange: netChange,
        oldBalance: user.balance,
        newBalance: newBalancePaisa
      }).catch(error => {
        console.error('Background update failed:', error.message);
        // Remove from processed so it retries next time
        processedRounds.delete(gameRound);
      });
    } else {
      console.log(`⚠️ Round ${gameRound} already processed, skipping update`);
    }
    
    return response;
    
  } catch (error) {
    console.log('🔥 Error:', error.message);
    
    return NextResponse.json({
      credit_amount: 999.99,
      timestamp: Date.now()
    });
  }
}

// Async function to update database
async function updateDatabase(data) {
  try {
    console.log(`🔄 Updating DB for round ${data.gameRound}`);
    
    // 1. Update user balance
    await prisma.user.update({
      where: { id: data.userId },
      data: { balance: data.newBalance }
    });
    
    // 2. Create CasinoSpin record
    try {
      await prisma.casinoSpin.create({
        data: {
          userId: data.userId,
          gameCode: 'JILI',
          gameName: 'JILI Casino',
          betAmount: data.betPaisa,
          winAmount: data.winPaisa,
          netResult: data.netChange,
          gameRound: data.gameRound,
          timestamp: new Date(),
          status: 'COMPLETED'
        }
      });
    } catch (spinError) {
      // Duplicate - that's okay
      console.log(`📝 Spin record already exists`);
    }
    
    console.log(`✅ DB updated: ${data.newBalance} paisa`);
    
  } catch (error) {
    console.error('🔥 Database update failed:', error.message);
    throw error; // Re-throw so caller knows it failed
  }
}