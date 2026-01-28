import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";


const JWT_SECRET = "SUPER_SECRET_KEY"; // move to .env later
const DEMO_BALANCE = 10; // 1000 TK in paisa
const JOIN_BONUS = 10; // 1000 TK for new user with promo code
const INVITER_BONUS = 10; // 500 TK for inviter

// Normalize phone numbers (0XXXXXXXXX or 880XXXXXXXXX -> 01XXXXXXXXX)
const normalizePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880")) return "0" + cleaned.slice(3);
  if (cleaned.startsWith("0")) return cleaned;
  return cleaned;
};

// Validate Bangladeshi phone number
const isValidBDPhone = (phone) => /^01\d{9}$/.test(phone);

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    let { firstName, lastName, phone, password, promoCode } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    phone = normalizePhone(phone);

    if (!isValidBDPhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      return res.status(400).json({ error: "Phone already registered" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find inviter
    let inviter = null;
    if (promoCode) {
      inviter = await prisma.user.findUnique({ where: { promoCode } });
    }

    const newPromoCode =
      "DOF" + uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();

    let startingBalance = DEMO_BALANCE;

    // 🔥 NEW: Get next casinoId
    const lastUser = await prisma.user.findFirst({
      orderBy: { casinoId: 'desc' }
    });
    
    const nextCasinoId = (lastUser?.casinoId || 999) + 1;

    // Create user in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          phone,
          password: hashedPassword,
          balance: startingBalance,
          promoCode: newPromoCode,
          referredById: inviter?.id || null,
          casinoId: nextCasinoId,
        },
      });

      // Create welcome bonus transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "DEMO_CREDIT",
          amount: startingBalance,
          status: "COMPLETED",
          reference: "WELCOME_BONUS",
          description: "Welcome bonus for new registration",
        },
      });

      // If inviter exists, give referral bonus
      if (inviter) {
        await prisma.user.update({
          where: { id: inviter.id },
          data: { balance: { increment: INVITER_BONUS } },
        });

        await prisma.transaction.create({
          data: {
            userId: inviter.id,
            type: "REFERRAL_REWARD",
            amount: INVITER_BONUS,
            status: "COMPLETED",
            reference: `INVITED_${user.id}`,
            description: `Referral bonus for inviting ${user.firstName} ${user.lastName}`,
          },
        });
      }

      // Generate JWT token for auto-login
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          role: user.role,
        },
        process.env.JWT_SECRET || JWT_SECRET,
        { expiresIn: "365d" }
      );

      return { user, token };
    });

    // Return response with auto-login token
    res.json({
      success: true,
      message: "Registered successfully",
      token: result.token, // Auto-login token
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone,
        balance: result.user.balance,
        promoCode: result.user.promoCode,
        casinoId: result.user.casinoId,
        createdAt: result.user.createdAt,
      },
    });

  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        error: "Phone number already registered" 
      });
    }
    
    res.status(500).json({ 
      error: "Server error during registration" 
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.id,      
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );


    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        promoCode: user.promoCode,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
