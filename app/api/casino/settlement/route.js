// app/api/casino/settle/route.js
import { NextResponse } from 'next/server';
import prisma from '@/server/prisma';

export async function POST(request) {
  try {
    const body = await request.json();

    const memberAccount = body.member_account || '';
    const sessionId = body.session_id || '';
    const matchId = body.match_id || '';
    const finalAmount = parseFloat(body.final_amount) || 0; // Optional: JILI might send final balance

    console.log(`🔄 Settlement request: User ${memberAccount}, Match: ${matchId}, Session: ${sessionId}`);

    // 1️⃣ Find user
    const user = await prisma.user.findFirst({
      where: { casinoId: parseInt(memberAccount) }
    });

    if (!user) {
      console.log(`❌ User not found: ${memberAccount}`);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      });
    }

    // 2️⃣ Find all PENDING spins for this match
    const pendingSpins = await prisma.casinoSpin.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
        matchId: matchId
      },
      orderBy: { timestamp: 'asc' }
    });

    if (pendingSpins.length === 0) {
      console.log(`ℹ️ No pending spins for match ${matchId}`);
      return NextResponse.json({
        success: true,
        message: 'No pending spins to settle'
      });
    }

    // 3️⃣ Calculate total from pending spins
    let totalNetResult = 0;
    for (const spin of pendingSpins) {
      totalNetResult += spin.netResult;
    }

    console.log(`📊 Settlement calculation:`);
    console.log(`   User current balance: ${user.balance} paisa`);
    console.log(`   Pending spins: ${pendingSpins.length}`);
    console.log(`   Total net result: ${totalNetResult} paisa`);
    console.log(`   Expected new balance: ${user.balance + totalNetResult} paisa`);

    // 4️⃣ Update user balance and mark spins as COMPLETED
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: totalNetResult } }
      });

      // Mark spins as COMPLETED
      await tx.casinoSpin.updateMany({
        where: {
          id: { in: pendingSpins.map(spin => spin.id) }
        },
        data: {
          status: 'COMPLETED'
        }
      });
    });

    // 5️⃣ Get updated balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true }
    });

    console.log(`✅ Settlement completed!`);
    console.log(`   New balance: ${updatedUser?.balance || 0} paisa`);
    console.log(`   Settled spins: ${pendingSpins.length}`);

    // 6️⃣ Return success
    return NextResponse.json({
      success: true,
      message: 'Settlement completed',
      user_id: memberAccount,
      previous_balance: user.balance,
      new_balance: updatedUser?.balance || 0,
      spins_settled: pendingSpins.length,
      net_change: totalNetResult
    });

  } catch (error) {
    console.error("🔥 Settlement error:", error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}