import { NextResponse } from 'next/server';
import prisma from '@/server/prisma';
import { updateTurnover } from '@/lib/turnover-tracker';

// ==================== CACHE & STATE MANAGEMENT ====================
class BetTracker {
  constructor() {
    this.activeBets = new Map(); // gameRound -> { userId, betAmount, timestamp }
    this.processedRounds = new Set(); // Track fully processed rounds
    this.BET_TIMEOUT = 300000; // 5 minutes
    this.CACHE_CLEANUP = 60000; // 1 minute
    
    // Periodic cleanup
    setInterval(() => this.cleanup(), this.CACHE_CLEANUP);
  }
  
  trackBet(gameRound, userId, betAmount) {
    this.activeBets.set(gameRound, {
      userId,
      betAmount,
      timestamp: Date.now()
    });
  }
  
  getBet(gameRound) {
    const bet = this.activeBets.get(gameRound);
    if (bet) {
      bet.timestamp = Date.now();
    }
    return bet;
  }
  
  removeBet(gameRound) {
    this.activeBets.delete(gameRound);
    this.processedRounds.add(gameRound);
  }
  
  isProcessed(gameRound) {
    return this.processedRounds.has(gameRound);
  }
  
  cleanup() {
    const now = Date.now();
    
    // Clean old active bets
    for (const [round, bet] of this.activeBets.entries()) {
      if (now - bet.timestamp > this.BET_TIMEOUT) {
        this.activeBets.delete(round);
      }
    }
    
    // Clean old processed rounds
    if (this.processedRounds.size > 1000) {
      const array = Array.from(this.processedRounds);
      const toRemove = array.slice(0, array.length - 1000);
      toRemove.forEach(round => this.processedRounds.delete(round));
    }
  }
  
  getStats() {
    return {
      activeBets: this.activeBets.size,
      processedRounds: this.processedRounds.size
    };
  }
}

// Global instance
const betTracker = new BetTracker();

// ==================== MAIN CALLBACK HANDLER ====================
export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // 1. Parse and validate request
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId') || '';
    
    const body = await request.json().catch(() => ({}));
    
    const memberAccount = String(body.member_account || '1000');
    const betAmount = parseFloat(body.bet_amount) || 0;
    const winAmount = parseFloat(body.win_amount) || 0;
    const gameRound = String(body.game_round || '');
    const casinoId = parseInt(memberAccount) || 0;
    
    // 2. Validate input
    if (!gameRound) {
      console.error('❌ Missing gameRound');
      return NextResponse.json({
        credit_amount: 0,
        timestamp: Date.now(),
        error: 'Invalid request'
      }, { status: 400 });
    }
    
    // 3. Check for duplicate processing (for crash games)
    if (betTracker.isProcessed(gameRound) && betAmount === 0 && winAmount === 0) {
      return NextResponse.json({
        credit_amount: 0,
        timestamp: Date.now(),
        cached: true
      });
    }
    
    // 4. Get user
    const user = await prisma.user.findFirst({
      where: { casinoId: casinoId },
      select: { 
        id: true, 
        balance: true, 
        isBanned: true,
        lockedBalance: true
      }
    });
    
    if (!user) {
      console.error(`❌ User not found for casinoId: ${casinoId}`);
      return NextResponse.json({
        credit_amount: 0,
        timestamp: Date.now(),
        error: 'User not found'
      }, { status: 404 });
    }
    
    if (user.isBanned) {
      console.error(`🚫 Banned user attempted callback: ${user.id}`);
      return NextResponse.json({
        credit_amount: 0,
        timestamp: Date.now(),
        error: 'Account suspended'
      }, { status: 403 });
    }
    
    // 5. Determine callback type and process
    const type = determineCallbackType(betAmount, winAmount);
    
    console.log(`📥 Callback [${type}]:`, { 
      casinoId, 
      betAmount, 
      winAmount, 
      gameRound,
      userId: user.id,
      matchId,
      lockedBalance: user.lockedBalance
    });
    
    let newBalance = user.balance;
    let transactionResult = null;
    
    switch(type) {
      case 'BET_PLACED':
        transactionResult = await handleBetPlaced(user.id, gameRound, betAmount, user.balance, matchId, user.lockedBalance);
        newBalance = transactionResult.newBalance;
        betTracker.trackBet(gameRound, user.id, betAmount);
        break;
        
      case 'GAME_WIN':
        transactionResult = await handleGameWin(user.id, gameRound, winAmount, user.balance, matchId);
        newBalance = transactionResult.newBalance;
        betTracker.removeBet(gameRound);
        break;
        
      case 'GAME_CRASH':
        transactionResult = await handleGameCrash(user.id, gameRound, user.balance);
        newBalance = transactionResult.newBalance;
        betTracker.removeBet(gameRound);
        break;
        
      case 'REGULAR_RESULT':
        transactionResult = await handleRegularResult(user.id, gameRound, betAmount, winAmount, user.balance, matchId);
        newBalance = transactionResult.newBalance;
        break;
        
      default:
        console.error(`❓ Unknown callback type: ${type}`);
        newBalance = user.balance;
    }
    
    // 6. Calculate and send response
    const creditAmount = parseFloat((newBalance / 100).toFixed(2));
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ ${type} processed in ${processingTime}ms:`, {
      oldBalance: user.balance,
      newBalance,
      creditAmount,
      netChange: newBalance - user.balance,
      turnoverApplied: transactionResult?.turnoverApplied || 0
    });
    
    return NextResponse.json({
      credit_amount: creditAmount,
      timestamp: Date.now(),
      balance_paisa: newBalance
    });
    
  } catch (error) {
    console.error('🔥 Callback error:', error.message);
    
    return NextResponse.json({
      credit_amount: 0,
      timestamp: Date.now(),
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// ==================== HELPER FUNCTIONS ====================
function determineCallbackType(betAmount, winAmount) {
  if (betAmount > 0 && winAmount === 0) return 'BET_PLACED';
  if (betAmount === 0 && winAmount > 0) return 'GAME_WIN';
  if (betAmount === 0 && winAmount === 0) return 'GAME_CRASH';
  if (betAmount > 0 && winAmount > 0) return 'REGULAR_RESULT';
  return 'UNKNOWN';
}

async function handleBetPlaced(userId, gameRound, betAmount, currentBalance, matchId, lockedBalance) {
  const betPaisa = Math.round(betAmount * 100);
  const newBalance = currentBalance - betPaisa;
  
  await prisma.$transaction(async (tx) => {
    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });
    
    // Create pending spin record
    await tx.casinoSpin.create({
      data: {
        userId: userId,
        gameCode: 'CRASH',
        gameName: 'Crash Game',
        betAmount: betPaisa,
        winAmount: 0,
        netResult: -betPaisa,
        gameRound: gameRound,
        timestamp: new Date(),
        status: 'PENDING',
        matchId: matchId || null
      }
    });
  });
  
  return { betPaisa, newBalance };
}

async function handleGameWin(userId, gameRound, winAmount, currentBalance, matchId) {
  const winPaisa = Math.round(winAmount * 100);
  const newBalance = currentBalance + winPaisa;
  let turnoverApplied = 0;
  
  const result = await prisma.$transaction(async (tx) => {
    // First, get the pending spin to update it
    const pendingSpin = await tx.casinoSpin.findFirst({
      where: {
        userId: userId,
        gameRound: gameRound,
        status: 'PENDING'
      }
    });
    
    if (!pendingSpin) {
      // If no pending spin, check if a completed spin already exists
      const existingSpin = await tx.casinoSpin.findFirst({
        where: {
          userId: userId,
          gameRound: gameRound,
          status: 'COMPLETED'
        }
      });
      
      if (existingSpin) {
        // Spin already processed, just update balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: newBalance }
        });
        return existingSpin;
      }
      
      throw new Error(`No spin found for round: ${gameRound}`);
    }
    
    // Update spin record with win
    const updatedSpin = await tx.casinoSpin.update({
      where: { id: pendingSpin.id },
      data: {
        winAmount: winPaisa,
        netResult: winPaisa,
        status: 'COMPLETED'
      }
    });
    
    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });
    
    return updatedSpin;
  });
  
  // ========== TURNOVER TRACKING FOR WIN ==========
  // For win-only callbacks, calculate effective turnover (0.5% of bet for wins)
  const effectiveTurnover = Math.max(1, Math.round(result.betAmount * 0.005)); // 0.5% of bet, min 1 paisa
  turnoverApplied = effectiveTurnover;
  
  console.log(`🏆 Win turnover: Bet=${result.betAmount}, Win=${winPaisa}, Turnover=${effectiveTurnover} (0.5%)`);
  
  try {
    await updateTurnover(
      userId, 
      result.betAmount,    // original bet amount
      winPaisa,            // win amount
      effectiveTurnover,   // effective turnover (0.5% of bet for wins)
      'casino_crash',      // game type
      matchId || gameRound // identifier
    );
  } catch (turnoverError) {
    console.error('Turnover tracking error in win:', turnoverError);
  }
  // ================================================
  
  return { winPaisa, newBalance, turnoverApplied };
}

async function handleGameCrash(userId, gameRound, currentBalance) {
  let turnoverApplied = 0;
  
  try {
    // Get and update the pending spin in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const pendingSpin = await tx.casinoSpin.findFirst({
        where: {
          userId: userId,
          gameRound: gameRound,
          status: 'PENDING'
        }
      });
      
      if (!pendingSpin) {
        // Check if spin already completed
        const existingSpin = await tx.casinoSpin.findFirst({
          where: {
            userId: userId,
            gameRound: gameRound,
            status: 'COMPLETED'
          }
        });
        
        if (existingSpin) {
          return existingSpin;
        }
        
        console.log(`ℹ️ No pending spin found for crash round: ${gameRound}`);
        return null;
      }
      
      // Mark spin as completed (crash = loss)
      const updatedSpin = await tx.casinoSpin.update({
        where: { id: pendingSpin.id },
        data: {
          status: 'COMPLETED'
          // winAmount stays 0, netResult stays -betAmount
        }
      });
      
      return updatedSpin;
    });
    
    // ========== TURNOVER TRACKING FOR LOSS ==========
    // For crash/loss, count full bet amount towards turnover
    if (result) {
      const effectiveTurnover = result.betAmount; // Full bet for loss
      turnoverApplied = effectiveTurnover;
      
      console.log(`💥 Crash/Loss turnover: Bet=${result.betAmount}, Turnover=${effectiveTurnover} (100%)`);
      
      try {
        await updateTurnover(
          userId, 
          result.betAmount,    // original bet amount
          0,                   // win amount (0 for loss)
          effectiveTurnover,   // effective turnover (full bet for loss)
          'casino_crash',      // game type
          gameRound            // identifier
        );
      } catch (turnoverError) {
        console.error('Turnover tracking error in crash:', turnoverError);
      }
    }
  } catch (error) {
    console.error('Error handling game crash:', error);
  }
  
  return { newBalance: currentBalance, turnoverApplied }; // No balance change
}

async function handleRegularResult(userId, gameRound, betAmount, winAmount, currentBalance, matchId) {
  const betPaisa = Math.round(betAmount * 100);
  const winPaisa = Math.round(winAmount * 100);
  const netChange = winPaisa - betPaisa;
  const newBalance = currentBalance + netChange;
  let turnoverApplied = 0;
  
  await prisma.$transaction(async (tx) => {
    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });
    
    // Create spin record
    await tx.casinoSpin.create({
      data: {
        userId: userId,
        gameCode: 'CASINO',
        gameName: 'Casino Game',
        betAmount: betPaisa,
        winAmount: winPaisa,
        netResult: netChange,
        gameRound: gameRound,
        timestamp: new Date(),
        status: 'COMPLETED',
        matchId: matchId || null
      }
    });
  });
  
  // ========== TURNOVER TRACKING FOR REGULAR GAMES ==========
  try {
    // Calculate effective turnover based on win/loss
    let effectiveTurnover;
    
    if (winPaisa === 0) {
      // Loss: full bet counts towards turnover
      effectiveTurnover = betPaisa;
      console.log(`❌ Loss turnover: Bet=${betPaisa}, Turnover=${effectiveTurnover} (100%)`);
    } else if (winPaisa >= betPaisa) {
      // Win (or break-even): only 0.5% of bet counts
      effectiveTurnover = Math.max(1, Math.round(betPaisa * 0.005)); // 0.5% of bet, min 1 paisa
      console.log(`✅ Win turnover: Bet=${betPaisa}, Win=${winPaisa}, Turnover=${effectiveTurnover} (0.5%)`);
    } else {
      // Partial win: only the lost portion counts
      effectiveTurnover = betPaisa - winPaisa;
      console.log(`⚠️ Partial win turnover: Bet=${betPaisa}, Win=${winPaisa}, Turnover=${effectiveTurnover} (lost portion)`);
    }
    
    turnoverApplied = effectiveTurnover;
    
    await updateTurnover(
      userId, 
      betPaisa,               // bet amount
      winPaisa,               // win amount
      effectiveTurnover,      // effective turnover
      'casino_slots',         // game type
      matchId || gameRound    // identifier
    );
  } catch (turnoverError) {
    console.error('Turnover tracking error in regular result:', turnoverError);
  }
  // ================================================
  
  return { betPaisa, winPaisa, netChange, newBalance, turnoverApplied };
}

// ==================== HEALTH ENDPOINT ====================
export async function GET() {
  const stats = betTracker.getStats();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: stats,
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    }
  });
}

// ==================== OPTIONS HANDLER ====================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}