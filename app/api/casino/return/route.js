// app/api/casino/return/route.js
import { NextResponse } from 'next/server';
import { userBalances } from '../callback/route';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    
    console.log(`🔙 User returned: ${matchId}`);
    
    // Clean up memory (optional)
    // userBalances.clear(); // Or remove specific user
    
    return NextResponse.redirect('/casino?message=game_completed');
    
  } catch (error) {
    console.error('Return error:', error.message);
    return NextResponse.redirect('/casino?error=server_error');
  }
}