#!/usr/bin/env tsx

/**
 * Script to create a premium test user with everything enabled for testing purposes
 *
 * Usage: npx tsx scripts/setup-premium-test-user.ts [email] [plan]
 *
 * Example: npx tsx scripts/setup-premium-test-user.ts test@example.com level_3
 */

import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@chaindesk/prisma';

const prisma = new PrismaClient();

async function createPremiumTestUser() {
  const email = process.argv[2] || 'premium-test@chaindesk.ai';
  const plan =
    (process.argv[3] as SubscriptionPlan) || SubscriptionPlan.level_3;

  console.log(
    `Creating premium test user with email: ${email} and plan: ${plan}`
  );

  try {
    // Generate unique IDs
    const userId = `test-user-${Date.now()}`;
    const orgId = `test-org-${Date.now()}`;
    const subscriptionId = `test-sub-${Date.now()}`;
    const apiKey = `test-api-${Date.now()}`;

    // First, let's get a price ID (we'll use any existing one for testing)
    const existingPrice = await prisma.price.findFirst();
    if (!existingPrice) {
      throw new Error(
        'No price found in database. Please ensure prices are seeded first.'
      );
    }

    // Create the premium test user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        emailVerified: new Date(),
        name: 'Premium Test User',
        memberships: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                id: orgId,
                name: 'Premium Test Organization',
                apiKeys: {
                  create: {
                    key: apiKey,
                  },
                },
                usage: {
                  create: {
                    // Reset all usage counters to 0 for testing
                    nbAgentQueries: 0,
                    nbDatastoreQueries: 0,
                    nbUploadedBytes: 0,
                    nbDataProcessingBytes: 0,
                    nbModelTokens: 0,
                    nbStoredTokens: 0,
                  },
                },
                subscriptions: {
                  create: {
                    id: subscriptionId,
                    status: SubscriptionStatus.active,
                    plan: plan,
                    customerId: `test-customer-${Date.now()}`,
                    priceId: existingPrice.id,
                    start_date: new Date(),
                    // Set trial end far in the future for testing
                    trial_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscriptions: true,
                usage: true,
                apiKeys: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Premium test user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`🏢 Organization ID: ${orgId}`);
    console.log(`💳 Subscription Plan: ${plan}`);
    console.log(`🔑 API Key: ${apiKey}`);
    console.log(`💳 Subscription ID: ${subscriptionId}`);

    console.log('\n🔧 Testing Instructions:');
    console.log('1. Use this email to sign in to the dashboard');
    console.log('2. The user will have premium access with the selected plan');
    console.log('3. All usage counters are reset to 0');
    console.log(
      '4. Trial is set for 1 year to avoid expiration during testing'
    );

    console.log('\n⚠️  Cleanup:');
    console.log('To remove this test user, run:');
    console.log(`npx tsx scripts/cleanup-test-user.ts ${userId}`);

    return user;
  } catch (error) {
    console.error('❌ Error creating premium test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await createPremiumTestUser();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default createPremiumTestUser;
