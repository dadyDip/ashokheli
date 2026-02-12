import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";
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

    // 🔥 NO STARTING BALANCE - Set to 0
    let startingBalance = 0; // Changed from DEMO_BALANCE to 0

    // 🔥 NEW: Get next casinoId
    const lastUser = await prisma.user.findFirst({
      orderBy: { casinoId: 'desc' }
    });
    
    const nextCasinoId = (lastUser?.casinoId || 999) + 1;

    // Create user with ZERO balance
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        balance: startingBalance, // 0 balance
        promoCode: newPromoCode,
        referredById: inviter?.id || null,
        casinoId: nextCasinoId,
      },
    });

    // If inviter exists, give referral bonus (but new user gets nothing)
    if (inviter) {
      await prisma.user.update({
        where: { id: inviter.id },
        data: { balance: { increment: INVITER_BONUS } },
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

    // Return response
    res.json({
      success: true,
      message: "Registered successfully - Please deposit to start playing",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        balance: user.balance, // Will be 0
        promoCode: user.promoCode,
        casinoId: user.casinoId,
        createdAt: user.createdAt,
      },
    });

  } catch (err) {
    console.error("Registration error:", err);
    
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
