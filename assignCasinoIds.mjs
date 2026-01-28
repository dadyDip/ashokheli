import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to assign casino IDs...');
  
  // Check current state
  const totalUsers = await prisma.user.count();
  const usersWithoutId = await prisma.user.count({
    where: { casinoId: null }
  });
  
  console.log(`Total users: ${totalUsers}`);
  console.log(`Users without casinoId: ${usersWithoutId}`);
  
  if (usersWithoutId === 0) {
    console.log('✅ All users already have casinoId');
    return;
  }
  
  // Get the highest casinoId
  const maxUser = await prisma.user.findFirst({
    where: { casinoId: { not: null } },
    orderBy: { casinoId: 'desc' }
  });
  
  let nextId = 1000;
  if (maxUser && maxUser.casinoId) {
    nextId = maxUser.casinoId + 1;
    console.log(`Highest existing casinoId: ${maxUser.casinoId}`);
  }
  
  console.log(`Starting from casinoId: ${nextId}`);
  
  // Get all users without casinoId
  const users = await prisma.user.findMany({
    where: { casinoId: null },
    orderBy: { createdAt: 'asc' }
  });
  
  // Assign casinoIds
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const casinoId = nextId + i;
    
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { casinoId: casinoId }
      });
      
      console.log(`✅ ${i + 1}/${users.length}: ${user.firstName} ${user.lastName} (${user.phone || 'no phone'}) -> ${casinoId}`);
    } catch (error) {
      console.error(`❌ Failed to update ${user.id}:`, error.message);
    }
  }
  
  console.log(`🎉 Successfully assigned casinoIds to ${users.length} users`);
  
  // Final verification
  const remaining = await prisma.user.count({
    where: { casinoId: null }
  });
  
  console.log(`Users still without casinoId: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });