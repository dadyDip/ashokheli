import prisma from "../prisma.js";

export async function getSystemWallet() {
  let wallet = await prisma.systemWallet.findFirst();

  if (!wallet) {
    wallet = await prisma.systemWallet.create({
      data: {
        balance: 1_000_000_000, // 🔥 initial house balance
      },
    });

    console.log("🏦 SystemWallet created", wallet.balance);
  }

  return wallet;
}
