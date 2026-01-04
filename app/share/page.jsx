// app/share/page.jsx
import PromoShare from "./PromoShare";
import prisma from "@/server/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export default async function SharePage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let promoCode = "NOT_SET";

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { promoCode: true },
      });

      if (user?.promoCode) promoCode = user.promoCode;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Share & Earn</h1>
      <PromoShare promoCode={promoCode} />
    </div>
  );
}
