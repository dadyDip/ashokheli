import prisma from "../server/prisma.js";
import crypto from "crypto";

async function main() {
  const users = await prisma.user.findMany({ where: { promoCode: null } });

  for (const user of users) {
    const code = "DOF" + crypto.randomBytes(3).toString("hex").toUpperCase();
    await prisma.user.update({
      where: { id: user.id },
      data: { promoCode: code },
    });
    console.log(`Generated promo for ${user.email}: ${code}`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
