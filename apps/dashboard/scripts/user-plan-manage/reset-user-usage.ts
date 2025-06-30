#!/usr/bin/env tsx

/**
 * Script to reset usage counters for a user/organization
 *
 * Usage: npx tsx scripts/reset-user-usage.ts <email>
 *
 * Example: npx tsx scripts/reset-user-usage.ts user@example.com
 */

import { PrismaClient } from '@chaindesk/prisma';

const prisma = new PrismaClient();

async function resetUserUsage(email: string) {
  console.log(`Resetting usage counters for user: ${email}`);

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                usage: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    const organization = user.memberships[0]?.organization;
    if (!organization) {
      throw new Error(`No organization found for user ${email}`);
    }

    if (!organization.usage) {
      // Create usage record if it doesn't exist
      await prisma.usage.create({
        data: {
          organizationId: organization.id,
          nbAgentQueries: 0,
          nbDatastoreQueries: 0,
          nbUploadedBytes: 0,
          nbDataProcessingBytes: 0,
          nbModelTokens: 0,
          nbStoredTokens: 0,
        },
      });
      console.log('✅ Usage record created and initialized to 0');
    } else {
      // Reset existing usage counters
      await prisma.usage.update({
        where: { id: organization.usage.id },
        data: {
          nbAgentQueries: 0,
          nbDatastoreQueries: 0,
          nbUploadedBytes: 0,
          nbDataProcessingBytes: 0,
          nbModelTokens: 0,
          nbStoredTokens: 0,
          notifiedAgentQueriesLimitReached: false,
          notifiedStoredTokenLimitReached: false,
        },
      });
      console.log('✅ Usage counters reset to 0');
    }

    console.log('\n📋 Usage Reset Complete:');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`🏢 Organization ID: ${organization.id}`);
    console.log(`🔄 Agent Queries: 0`);
    console.log(`🔄 Datastore Queries: 0`);
    console.log(`🔄 Uploaded Bytes: 0`);
    console.log(`🔄 Data Processing Bytes: 0`);
    console.log(`🔄 Model Tokens: 0`);
    console.log(`🔄 Stored Tokens: 0`);
  } catch (error) {
    console.error('❌ Error resetting user usage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/reset-user-usage.ts <email>');
    process.exit(1);
  }

  await resetUserUsage(email);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default resetUserUsage;
