#!/usr/bin/env tsx

/**
 * Script to clean up test users created by setup-premium-test-user.ts
 *
 * Usage: npx tsx scripts/cleanup-test-user.ts <userId>
 *
 * Example: npx tsx scripts/cleanup-test-user.ts test-user-1234567890
 */

import { PrismaClient } from '@chaindesk/prisma';

const prisma = new PrismaClient();

async function cleanupTestUser(userId: string) {
  console.log(`Cleaning up test user: ${userId}`);

  try {
    // Get user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscriptions: true,
                usage: true,
                apiKeys: true,
                agents: true,
                datastores: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`Found user: ${user.email}`);

    // Delete the user (this will cascade delete related data due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log('✅ Test user and all related data cleaned up successfully!');
  } catch (error) {
    console.error('❌ Error cleaning up test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error('❌ Please provide a user ID');
    console.log('Usage: npx tsx scripts/cleanup-test-user.ts <userId>');
    process.exit(1);
  }

  await cleanupTestUser(userId);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default cleanupTestUser;
