// app/api/casino/settle/route.js
import { NextResponse } from 'next/server';
import prisma from '@/server/prisma';
import { sessionBalances } from '../callback/route'; // Import from your callback

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    
    if (!matchId) {
      return NextResponse.json({
        success: false,
        error: 'Missing matchId'
      });
    }
    
    console.log(`🔄 Settlement request for match: ${matchId}`);
    
    // Get session data
    const session = sessionBalances.get(matchId);
    
    if (!session) {
      console.log(`ℹ️ No active session found for ${matchId}`);
      return NextResponse.json({
        success: true,
        message: 'No active session to settle'
      });
    }
    
    const { balance: finalBalance, userId } = session;
    
    console.log(`💰 Final settlement: User ${userId}, Balance: ${finalBalance} paisa`);
    
    // Update user balance to match session balance
    await prisma.user.update({
      where: { id: userId },
      data: { balance: finalBalance }
    });
    
    // Mark all spins for this match as SETTLED
    await prisma.casinoSpin.updateMany({
      where: {
        userId: userId,
        matchId: matchId,
        status: 'COMPLETED'
      },
      data: {
        status: 'SETTLED',
        settledAt: new Date()
      }
    });
    
    // Clean up session
    sessionBalances.delete(matchId);
    
    console.log(`✅ Settlement completed for match ${matchId}`);
    console.log(`   Final balance: ${finalBalance} paisa`);
    console.log(`   Session cleaned up`);
    
    return NextResponse.json({
      success: true,
      message: 'Settlement completed',
      userId: userId,
      finalBalance: finalBalance,
      finalBalanceTaka: finalBalance / 100
    });
    
  } catch (error) {
    console.error('🔥 Settlement error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}