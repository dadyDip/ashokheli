import prisma from './prisma.js';

let aiUserId;

const AI_USERS = [
  { id: "ai-red", name: "AI Red" },
  { id: "ai-green", name: "AI Green" },
  { id: "ai-yellow", name: "AI Yellow" },
];

export function getAIUsers(count = 3) {
  return AI_USERS.slice(0, count);
}

export async function getAIUserId() {
  if (aiUserId) return aiUserId;

  const aiUser = await prisma.user.findFirst({ where: { isAI: true } });
  if (!aiUser) throw new Error("AI user does not exist. Run createAIUser.js first.");

  aiUserId = aiUser.id;
  return aiUserId;
}