import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response("Invalid credentials", { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return new Response("Invalid credentials", { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,          // 🔥 MUST BE `id`
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return Response.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // ✅ THIS WAS MISSING
      },
    });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
