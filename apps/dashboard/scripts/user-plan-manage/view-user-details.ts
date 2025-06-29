#!/usr/bin/env tsx

/**
 * Script to view user details, subscription status, and usage
 *
 * Usage: npx tsx scripts/view-user-details.ts <email>
 *
 * Example: npx tsx scripts/view-user-details.ts user@example.com
 */

import { PrismaClient } from '@chaindesk/prisma';
import accountConfig from '@chaindesk/lib/account-config';

const prisma = new PrismaClient();

async function viewUserDetails(email: string) {
  console.log(`Fetching details for user: ${email}`);

  try {
    // Find user by email with all related data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscriptions: {
                  where: {
                    status: {
                      in: ['active', 'trialing'],
                    },
                  },
                },
                usage: true,
                apiKeys: true,
                agents: {
                  where: { hidden: false },
                },
                datastores: true,
                _count: {
                  select: {
                    agents: {
                      where: { hidden: false },
                    },
                    datastores: true,
                  },
                },
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

    const organization = user.memberships[0]?.organization;
    if (!organization) {
      console.log('❌ No organization found for user');
      return;
    }

    // Determine premium status and current plan
    const activeSubscription = organization.subscriptions[0];
    const currentPlan = activeSubscription?.plan || 'level_0';
    const isPremium = organization.subscriptions.length > 0;
    const planConfig = accountConfig[currentPlan];

    console.log('\n' + '='.repeat(60));
    console.log('👤 USER DETAILS');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name || 'Not set'}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`✅ Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`📅 Created: ${user.createdAt.toLocaleDateString()}`);

    console.log('\n' + '='.repeat(60));
    console.log('🏢 ORGANIZATION DETAILS');
    console.log('='.repeat(60));
    console.log(`🏢 Organization: ${organization.name || 'Unnamed'}`);
    console.log(`🆔 Organization ID: ${organization.id}`);
    console.log(`🔑 API Keys: ${organization.apiKeys.length}`);
    if (organization.apiKeys.length > 0) {
      organization.apiKeys.forEach((key, index) => {
        console.log(`   Key ${index + 1}: ${key.key}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('💳 SUBSCRIPTION DETAILS');
    console.log('='.repeat(60));
    console.log(`💎 Premium Status: ${isPremium ? '✅ Premium' : '❌ Free'}`);
    console.log(
      `📋 Current Plan: ${currentPlan} (${planConfig?.label || 'Unknown'})`
    );

    if (activeSubscription) {
      console.log(`🆔 Subscription ID: ${activeSubscription.id}`);
      console.log(`📊 Status: ${activeSubscription.status}`);
      console.log(`💰 Customer ID: ${activeSubscription.customerId}`);
      console.log(
        `📅 Start Date: ${
          activeSubscription.start_date?.toLocaleDateString() || 'Not set'
        }`
      );
      console.log(
        `🔚 Trial End: ${
          activeSubscription.trial_end?.toLocaleDateString() || 'No trial'
        }`
      );
      console.log(
        `❌ Canceled At: ${
          activeSubscription.canceled_at?.toLocaleDateString() || 'Not canceled'
        }`
      );
    } else {
      console.log(`📋 No active subscription (Free plan)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 PLAN LIMITS');
    console.log('='.repeat(60));
    if (planConfig) {
      console.log(`🤖 Max Agents: ${planConfig.limits.maxAgents}`);
      console.log(`📚 Max Datastores: ${planConfig.limits.maxDatastores}`);
      console.log(
        `💬 Max Agent Queries: ${planConfig.limits.maxAgentsQueries}/month`
      );
      console.log(
        `💾 Max Stored Tokens: ${(
          planConfig.limits.maxStoredTokens / 1000000
        ).toFixed(1)}M`
      );
      console.log(
        `📎 Max File Size: ${(planConfig.limits.maxFileSize / 1000000).toFixed(
          1
        )}MB`
      );
      console.log(`👥 Max Seats: ${planConfig.limits.maxSeats}`);
      console.log(`🌐 Max Website URLs: ${planConfig.limits.maxWebsiteURL}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 CURRENT USAGE');
    console.log('='.repeat(60));
    const usage = organization.usage;
    if (usage) {
      const agentUsagePercent = planConfig
        ? (
            (usage.nbAgentQueries / planConfig.limits.maxAgentsQueries) *
            100
          ).toFixed(1)
        : '0';
      const storageUsagePercent = planConfig
        ? (
            (usage.nbStoredTokens / planConfig.limits.maxStoredTokens) *
            100
          ).toFixed(1)
        : '0';

      console.log(
        `💬 Agent Queries: ${usage.nbAgentQueries} (${agentUsagePercent}% of limit)`
      );
      console.log(`📚 Datastore Queries: ${usage.nbDatastoreQueries}`);
      console.log(
        `📤 Uploaded Bytes: ${(usage.nbUploadedBytes / 1000000).toFixed(2)}MB`
      );
      console.log(
        `⚡ Data Processing Bytes: ${(
          usage.nbDataProcessingBytes / 1000000
        ).toFixed(2)}MB`
      );
      console.log(`🎯 Model Tokens: ${usage.nbModelTokens.toLocaleString()}`);
      console.log(
        `💾 Stored Tokens: ${(usage.nbStoredTokens / 1000000).toFixed(
          2
        )}M (${storageUsagePercent}% of limit)`
      );

      if (usage.notifiedAgentQueriesLimitReached) {
        console.log(`⚠️  Agent queries limit notification sent`);
      }
      if (usage.notifiedStoredTokenLimitReached) {
        console.log(`⚠️  Storage limit notification sent`);
      }
    } else {
      console.log(`📊 No usage data available`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📚 RESOURCES');
    console.log('='.repeat(60));
    console.log(
      `🤖 Agents: ${organization._count.agents} / ${
        planConfig?.limits.maxAgents || 'Unknown'
      }`
    );
    console.log(
      `📚 Datastores: ${organization._count.datastores} / ${
        planConfig?.limits.maxDatastores || 'Unknown'
      }`
    );

    if (organization.agents.length > 0) {
      console.log(`\n🤖 Agent List:`);
      organization.agents.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.name} (${agent.id})`);
      });
    }

    if (organization.datastores.length > 0) {
      console.log(`\n📚 Datastore List:`);
      organization.datastores.forEach((datastore, index) => {
        console.log(`   ${index + 1}. ${datastore.name} (${datastore.id})`);
      });
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/view-user-details.ts <email>');
    process.exit(1);
  }

  await viewUserDetails(email);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default viewUserDetails;
