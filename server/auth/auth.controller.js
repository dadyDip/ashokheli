import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = "SUPER_SECRET_KEY"; // move to .env later
const DEMO_BALANCE = 100000; // 1000 TK in paisa
const JOIN_BONUS = 100000; // 1000 TK for new user with promo code
const INVITER_BONUS = 50000; // 500 TK for inviter

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
    let { firstName, lastName, email, phone, password, promoCode } = req.body;

    if (!firstName || !lastName || !password || (!email && !phone)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    phone = normalizePhone(phone);

    if (phone && !isValidBDPhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // Check email uniqueness
    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) return res.status(400).json({ error: "Email already registered" });
    }

    // Check phone uniqueness
    if (phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) return res.status(400).json({ error: "Phone already registered" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find inviter if promo code is used
    let inviter = null;
    if (promoCode) {
      inviter = await prisma.user.findUnique({ where: { promoCode } });
    }

    // Generate a unique promo code for new user
    const newPromoCode = "DOF" + crypto.randomBytes(3).toString("hex").toUpperCase();

    // Calculate starting balance
    let startingBalance = DEMO_BALANCE;
    if (inviter) startingBalance += JOIN_BONUS;

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        balance: startingBalance,
        promoCode: newPromoCode,
        referredById: inviter?.id || null,
      },
    });

    // Record demo balance transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEMO_CREDIT",
        amount: DEMO_BALANCE,
        status: "COMPLETED",
        reference: "WELCOME_BONUS",
      },
    });

    // If joined with a promo code, record join bonus transaction
    if (inviter) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "REFERRAL_BONUS",
          amount: JOIN_BONUS,
          status: "COMPLETED",
          reference: `JOINED_WITH_${promoCode}`,
        },
      });

      // Give inviter bonus
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
        },
      });
    }

    res.json({
      success: true,
      message: "Registered successfully",
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

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
    });

    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

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
