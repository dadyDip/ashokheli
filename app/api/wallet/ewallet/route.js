// app/api/wallet/ewallet/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, accountNumber, accountHolder } = await req.json();

  // Validate
  if (!type || !accountNumber || !accountHolder) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!['bkash', 'nagad', 'rocket'].includes(type)) {
    return NextResponse.json({ error: "Invalid wallet type" }, { status: 400 });
  }

  // Validate Bangladeshi mobile number
  if (!accountNumber.match(/^01[3-9]\d{8}$/)) {
    return NextResponse.json(
      { error: "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)" },
      { status: 400 }
    );
  }

  try {
    // Check if user already has 4 wallets
    const walletCount = await prisma.eWallet.count({
      where: { userId: user.id }
    });

    if (walletCount >= 4) {
      return NextResponse.json(
        { error: "Maximum 4 wallets allowed" },
        { status: 400 }
      );
    }

    // Check if this SAME NUMBER + SAME TYPE is already used by ANOTHER user
    const existingWalletOtherUser = await prisma.eWallet.findFirst({
      where: { 
        accountNumber,
        type,
        NOT: { userId: user.id }
      }
    });

    if (existingWalletOtherUser) {
      return NextResponse.json(
        { error: "This " + type + " number is already registered with another user" },
        { status: 400 }
      );
    }

    // Check if user already has this exact number + type (duplicate for themselves)
    const existingWalletSameUser = await prisma.eWallet.findFirst({
      where: { 
        userId: user.id,
        accountNumber,
        type
      }
    });

    if (existingWalletSameUser) {
      return NextResponse.json(
        { error: "You already have this " + type + " number added" },
        { status: 400 }
      );
    }

    // If this is the first wallet, set as default
    const isFirstWallet = walletCount === 0;

    const wallet = await prisma.eWallet.create({
      data: {
        userId: user.id,
        type,
        accountNumber,
        accountHolder,
        isDefault: isFirstWallet
      }
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        type: wallet.type,
        accountNumber: wallet.accountNumber,
        accountHolder: wallet.accountHolder,
        isDefault: wallet.isDefault
      }
    });
    
  } catch (err) {
    console.error("Error adding e-wallet:", err);
    
    // Handle unique constraint violations
    if (err.code === 'P2002') {
      // Check which unique constraint failed
      const fields = err.meta?.target;
      
      if (fields?.includes('accountNumber') && fields?.includes('type')) {
        if (fields?.includes('userId')) {
          return NextResponse.json(
            { error: "You already have this " + type + " number added" },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "This " + type + " number is already registered with another user" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Failed to add e-wallet" },
      { status: 500 }
    );
  }
}

// Set default wallet
export async function PUT(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { walletId } = await req.json();

  try {
    // Remove default from all user's wallets
    await prisma.eWallet.updateMany({
      where: { userId: user.id },
      data: { isDefault: false }
    });

    // Set new default
    await prisma.eWallet.update({
      where: { id: walletId, userId: user.id },
      data: { isDefault: true }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error setting default wallet:", err);
    return NextResponse.json(
      { error: "Failed to set default wallet" },
      { status: 500 }
    );
  }
}

// Delete wallet
export async function DELETE(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const walletId = url.searchParams.get('id');

  if (!walletId) {
    return NextResponse.json({ error: "Wallet ID required" }, { status: 400 });
  }

  try {
    const wallet = await prisma.eWallet.findFirst({
      where: { id: walletId, userId: user.id }
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    await prisma.eWallet.delete({
      where: { id: walletId }
    });

    // If deleted wallet was default, set another wallet as default
    if (wallet.isDefault) {
      const anotherWallet = await prisma.eWallet.findFirst({
        where: { userId: user.id }
      });

      if (anotherWallet) {
        await prisma.eWallet.update({
          where: { id: anotherWallet.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting wallet:", err);
    return NextResponse.json(
      { error: "Failed to delete wallet" },
      { status: 500 }
    );
  }
}