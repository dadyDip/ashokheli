// app/api/wallet/transaction-password/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json();

  // Validate
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    // Check if user already has transaction password
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasTransactionPassword: true }
    });

    if (existingUser?.hasTransactionPassword) {
      return NextResponse.json(
        { error: "Transaction password already set" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        transactionPassword: hashedPassword,
        hasTransactionPassword: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Transaction password set successfully"
    });

  } catch (err) {
    console.error("Error setting transaction password:", err);
    return NextResponse.json(
      { error: "Failed to set transaction password" },
      { status: 500 }
    );
  }
}

// Verify transaction password (for withdraw)
export async function PUT(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { transactionPassword: true, hasTransactionPassword: true }
    });

    if (!dbUser?.hasTransactionPassword || !dbUser?.transactionPassword) {
      return NextResponse.json(
        { error: "Transaction password not set" },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, dbUser.transactionPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect transaction password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password verified"
    });

  } catch (err) {
    console.error("Error verifying transaction password:", err);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}

// Change transaction password (if needed)
export async function PATCH(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { transactionPassword: true }
    });

    if (!dbUser?.transactionPassword) {
      return NextResponse.json(
        { error: "Transaction password not set" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.transactionPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        transactionPassword: hashedPassword
      }
    });

    return NextResponse.json({
      success: true,
      message: "Transaction password updated successfully"
    });

  } catch (err) {
    console.error("Error updating transaction password:", err);
    return NextResponse.json(
      { error: "Failed to update transaction password" },
      { status: 500 }
    );
  }
}