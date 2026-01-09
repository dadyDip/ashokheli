import prisma from "../server/prisma.js";
import { v4 as uuidv4 } from "uuid";


async function main() {
  const users = await prisma.user.findMany({ where: { promoCode: null } });

  for (const user of users) {
    const code = "DOF" + uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
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
