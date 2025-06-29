#!/usr/bin/env tsx

/**
 * Simple script to create test price records in the database
 * This bypasses Stripe and creates minimal data needed for user management scripts
 */

import { PrismaClient, SubscriptionPlan } from '@chaindesk/prisma';

const prisma = new PrismaClient();

async function createTestPrices() {
  console.log('🚀 Starting test price creation...');

  try {
    // Check if prices already exist
    const existingPrices = await prisma.price.findMany();
    if (existingPrices.length > 0) {
      console.log(
        `✅ Found ${existingPrices.length} existing price records. Database is already seeded!`
      );
      return;
    }

    console.log('Creating test price records...');

    // Create test products first
    const products = [
      {
        id: 'prod_test_free',
        name: 'Free Plan',
        description: 'Free tier with basic features',
        active: true,
      },
      {
        id: 'prod_test_enterprise',
        name: 'Enterprise Plan',
        description: 'Enterprise tier with full features',
        active: true,
      },
    ];

    // Create test prices
    const prices = [
      {
        id: 'price_test_free',
        product_id: 'prod_test_free',
        currency: 'usd',
        active: true,
        type: 'recurring',
        unit_amount: 0,
        interval: 'month',
        interval_count: 1,
      },
      {
        id: 'price_test_enterprise',
        product_id: 'prod_test_enterprise',
        currency: 'usd',
        active: true,
        type: 'recurring',
        unit_amount: 29999, // $299.99
        interval: 'month',
        interval_count: 1,
      },
    ];

    // Insert products
    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        create: product,
        update: product,
      });
      console.log(`✓ Created/updated product: ${product.name}`);
    }

    // Insert prices
    for (const price of prices) {
      await prisma.price.upsert({
        where: { id: price.id },
        create: {
          id: price.id,
          currency: price.currency,
          active: price.active,
          type: price.type as any,
          unitAmount: price.unit_amount,
          interval: price.interval as any,
          interval_count: price.interval_count,
          product: {
            connect: { id: price.product_id },
          },
        },
        update: {
          currency: price.currency,
          active: price.active,
          type: price.type as any,
          unitAmount: price.unit_amount,
          interval: price.interval as any,
          interval_count: price.interval_count,
        },
      });
      console.log(`✓ Created/updated price: ${price.id}`);
    }

    console.log('\n✅ Test price records created successfully!');
    console.log('You can now run the user management scripts.');
  } catch (error) {
    console.error('❌ Error creating test prices:', error);
    throw error;
  }
}

async function main() {
  try {
    await createTestPrices();
  } catch (error) {
    console.error('❌ Failed to create test prices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export default createTestPrices;
