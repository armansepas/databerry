#!/usr/bin/env tsx

/**
 * Script to modify user subscription status and plan
 *
 * Usage: npx tsx scripts/modify-user-subscription.ts <email> <plan> [status]
 *
 * Examples:
 * - npx tsx scripts/modify-user-subscription.ts user@example.com level_3
 * - npx tsx scripts/modify-user-subscription.ts user@example.com level_2 active
 * - npx tsx scripts/modify-user-subscription.ts user@example.com level_0 canceled
 */

import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@chaindesk/prisma';

const prisma = new PrismaClient();

async function modifyUserSubscription(
  email: string,
  plan: SubscriptionPlan,
  status: SubscriptionStatus = SubscriptionStatus.active
) {
  console.log(`Modifying subscription for user: ${email}`);
  console.log(`New plan: ${plan}`);
  console.log(`Status: ${status}`);

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscriptions: true,
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

    // Get existing price (we'll use any for testing)
    const existingPrice = await prisma.price.findFirst();
    if (!existingPrice) {
      throw new Error(
        'No price found in database. Please ensure prices are seeded first.'
      );
    }

    // Check if user already has a subscription
    const existingSubscription = organization.subscriptions[0];

    if (plan === SubscriptionPlan.level_0) {
      // Downgrade to free - cancel existing subscription
      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: SubscriptionStatus.canceled,
            canceled_at: new Date(),
            ended_at: new Date(),
          },
        });
        console.log('✅ Subscription canceled - user downgraded to free plan');
      } else {
        console.log('✅ User is already on free plan (no subscription)');
      }
    } else {
      // Create or update premium subscription
      if (existingSubscription) {
        // Update existing subscription
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            plan,
            status,
            canceled_at:
              status === SubscriptionStatus.canceled ? new Date() : null,
            ended_at:
              status === SubscriptionStatus.canceled ? new Date() : null,
            start_date:
              status === SubscriptionStatus.active
                ? new Date()
                : existingSubscription.start_date,
          },
        });
        console.log('✅ Existing subscription updated');
      } else {
        // Create new subscription
        await prisma.subscription.create({
          data: {
            organizationId: organization.id,
            plan,
            status,
            customerId: `manual-${Date.now()}`,
            priceId: existingPrice.id,
            start_date: new Date(),
            trial_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year trial for testing
          },
        });
        console.log('✅ New subscription created');
      }
    }

    // Reset usage counters for clean testing
    if (organization.usage) {
      await prisma.usage.update({
        where: { id: organization.usage.id },
        data: {
          nbAgentQueries: 0,
          nbDatastoreQueries: 0,
          nbUploadedBytes: 0,
          nbDataProcessingBytes: 0,
          nbModelTokens: 0,
          nbStoredTokens: 0,
        },
      });
      console.log('✅ Usage counters reset to 0');
    }

    console.log('\n📋 Updated User Details:');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`🏢 Organization ID: ${organization.id}`);
    console.log(`💳 Plan: ${plan}`);
    console.log(`📊 Status: ${status}`);
    console.log(`🔄 Usage Reset: Yes`);
  } catch (error) {
    console.error('❌ Error modifying user subscription:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const email = process.argv[2];
  const plan = process.argv[3] as SubscriptionPlan;
  const status =
    (process.argv[4] as SubscriptionStatus) || SubscriptionStatus.active;

  if (!email || !plan) {
    console.error('❌ Please provide email and plan');
    console.log(
      'Usage: npx tsx scripts/modify-user-subscription.ts <email> <plan> [status]'
    );
    console.log('\nAvailable plans:');
    Object.values(SubscriptionPlan).forEach((p) => console.log(`  - ${p}`));
    console.log('\nAvailable statuses:');
    Object.values(SubscriptionStatus).forEach((s) => console.log(`  - ${s}`));
    process.exit(1);
  }

  if (!Object.values(SubscriptionPlan).includes(plan)) {
    console.error(`❌ Invalid plan: ${plan}`);
    console.log('Available plans:');
    Object.values(SubscriptionPlan).forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }

  if (!Object.values(SubscriptionStatus).includes(status)) {
    console.error(`❌ Invalid status: ${status}`);
    console.log('Available statuses:');
    Object.values(SubscriptionStatus).forEach((s) => console.log(`  - ${s}`));
    process.exit(1);
  }

  await modifyUserSubscription(email, plan, status);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default modifyUserSubscription;
