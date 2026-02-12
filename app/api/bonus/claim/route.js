import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { type, amount, friendId } = await req.json();

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let bonusAmount = 0;
    let turnoverMultiplier = 10;
    let expiryDate = null;
    let message = "";

    switch (type) {
      case "first_deposit_300":
        if (user.isFirstDepositBonusClaimed) {
          return NextResponse.json({ 
            error: "ওয়েলকাম বোনাস ইতিমধ্যে নিয়েছেন!" 
          }, { status: 400 });
        }
        
        const depositAmount = user.totalDeposited / 100;
        
        if (depositAmount < 300) {
          return NextResponse.json({ 
            error: `আরও ${300 - depositAmount}৳ ডিপোজিট করে ৫,০০০৳ বোনাস নিন!` 
          }, { status: 400 });
        }
        
        if (depositAmount > 500) {
          return NextResponse.json({ 
            error: "বোনাস শুধুমাত্র ৩০০-৫০০৳ ডিপোজিটে পাওয়া যাবে!" 
          }, { status: 400 });
        }
        
        bonusAmount = Math.min(depositAmount * 1, 5000);
        expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        message = `🎊 অভিনন্দন! ${bonusAmount}৳ ওয়েলকাম বোনাস যোগ হয়েছে!`;
        break;

      case "red_card":
        if (user.totalDeposited < 30000) {
          return NextResponse.json({ 
            error: "প্রথমে ৩০০৳ ডিপোজিট করুন ডেইলি বোনাস পাওয়ার জন্য!" 
          }, { status: 400 });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dailyBonusesToday = await prisma.bonus.count({
          where: {
            userId: userId,
            type: "red_card",
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (dailyBonusesToday >= 2) {
          return NextResponse.json({ 
            error: "আপনি আজকের ২টি বোনাসই নিয়েছেন! কাল আবার চেষ্টা করুন" 
          }, { status: 400 });
        }
        
        // Use provided amount from modal
        bonusAmount = parseFloat(amount);
        if (isNaN(bonusAmount) || bonusAmount < 0.50 || bonusAmount > 5.00) {
          return NextResponse.json({ 
            error: "অবৈধ বোনাস পরিমাণ!" 
          }, { status: 400 });
        }
        
        expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        message = `🎉 ${bonusAmount}৳ বোনাস যোগ হয়েছে!`;
        break;

      case "referral_reward":
        if (!friendId) {
          return NextResponse.json({ 
            error: "বন্ধুর আইডি প্রয়োজন" 
          }, { status: 400 });
        }
        
        // Check if already claimed for this friend
        const existingReward = await prisma.bonus.findFirst({
          where: {
            userId: userId,
            type: "referral_reward",
            // Can't use metadata, so we'll check by amount and date range
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });

        if (existingReward) {
          return NextResponse.json({ 
            error: "এই বন্ধুর জন্য রিওয়ার্ড ইতিমধ্যে নিয়েছেন!" 
          }, { status: 400 });
        }
        
        const friend = await prisma.user.findUnique({
          where: { id: friendId }
        });

        if (!friend) {
          return NextResponse.json({ 
            error: "বন্ধু পাওয়া যায়নি" 
          }, { status: 400 });
        }

        if (friend.referredById !== userId) {
          return NextResponse.json({ 
            error: "আপনি এই বন্ধুকে রেফার করেননি" 
          }, { status: 400 });
        }

        if (friend.totalDeposited < 30000) {
          return NextResponse.json({ 
            error: `বন্ধুকে ৩০০৳ ডিপোজিট করতে হবে! বর্তমান: ${friend.totalDeposited/100}৳` 
          }, { status: 400 });
        }

        if (friend.totalTurnover < 300000) {
          const needed = (300000 - friend.totalTurnover) / 100;
          return NextResponse.json({ 
            error: `বন্ধুকে আরও ${needed}৳ বাজি ধরতে হবে! বর্তমান: ${friend.totalTurnover/100}৳` 
          }, { status: 400 });
        }
        
        bonusAmount = 250;
        expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        message = `💰 ২৫০৳ রেফারেল বোনাস যোগ হয়েছে!`;
        break;

      default:
        return NextResponse.json({ error: "Invalid bonus type" }, { status: 400 });
    }

    // Convert to paisa
    const bonusAmountPaisa = Math.round(bonusAmount * 100);
    const turnoverAmountPaisa = bonusAmountPaisa * turnoverMultiplier;

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: bonusAmountPaisa },
          lockedBalance: { increment: bonusAmountPaisa },
          totalBonusGiven: { increment: bonusAmountPaisa },
          lastBonusClaimedAt: new Date(),
          ...(type === "first_deposit_300" && { isFirstDepositBonusClaimed: true })
        }
      });

      // Create bonus record - NO METADATA FIELD
      const bonus = await tx.bonus.create({
        data: {
          userId: userId,
          type: type,
          amount: bonusAmountPaisa,
          originalAmount: bonusAmountPaisa,
          turnoverAmount: turnoverAmountPaisa,
          currentTurnover: 0,
          status: "active",
          isWithdrawable: false,
          expiresAt: expiryDate
          // NO METADATA HERE - it doesn't exist in schema
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: userId,
          type: "BONUS",
          amount: bonusAmountPaisa,
          status: "COMPLETED",
          provider: "bonus_system",
          reference: `BONUS_${bonus.id}`,
          // Use JSON string for metadata since it exists in transaction schema
          metadata: JSON.stringify({
            bonusType: type,
            turnoverRequired: turnoverAmountPaisa,
            turnoverMultiplier: turnoverMultiplier,
            ...(type === "referral_reward" && { friendId: friendId })
          })
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: message,
      bonus: {
        amount: bonusAmount,
        type: type,
        turnoverRequired: turnoverAmountPaisa / 100,
        expiresAt: expiryDate
      }
    });

  } catch (err) {
    console.error("Bonus claim error:", err);
    return NextResponse.json({ 
      error: "বোনাস ক্লেইম করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!" 
    }, { status: 500 });
  }
}