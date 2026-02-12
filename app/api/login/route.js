import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// normalize BD phone
const normalizePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880")) return "0" + cleaned.slice(3);
  if (cleaned.startsWith("0")) return cleaned;
  return cleaned;
};
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";


export async function POST(req) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return Response.json(
        { error: "Phone and password are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return Response.json(
        { error: "Account not found. Please register." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,      // 🔥 SAME AS BEFORE
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "365d" }
    );


    return Response.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        promoCode: user.promoCode,
        role: user.role,
      },
    });

  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
