import prisma from "../prisma.js";

export async function getSystemWallet(tx) {
  const wallet = await tx.systemWallet.findFirst();
  if (!wallet) throw new Error("SYSTEM_WALLET_NOT_FOUND");
  return wallet;
}
