# Premium Implementation Guide

This document provides a comprehensive guide to the Chaindesk premium subscription system, user management, and deployment procedures.

## Table of Contents

1. [Premium System Overview](#premium-system-overview)
2. [Subscription Levels](#subscription-levels)
3. [User Premium Status](#user-premium-status)
4. [Credits and Usage System](#credits-and-usage-system)
5. [Implementation Work Completed](#implementation-work-completed)
6. [Database Seeding and Price Management](#database-seeding-and-price-management)
7. [User Management Scripts](#user-management-scripts)
8. [Deployment Guide](#deployment-guide)
9. [Testing and Verification](#testing-and-verification)

## Premium System Overview

The Chaindesk premium system is built around a subscription-based model with multiple tiers offering different features and usage limits. Users are considered premium if they have active subscriptions, and their plan level determines their access to features and usage quotas.

### Key Components

- **Subscription Plans**: 6 different levels (level_0 to level_4)
- **Usage Tracking**: Monthly quotas with automatic resets
- **Plan Enforcement**: Real-time limit checking
- **Payment Integration**: Stripe-based billing (can be bypassed for testing)

## Subscription Levels

The system supports 6 subscription levels with escalating features and limits:

### Level 0 - Free Plan (Enhanced)

```typescript
level_0: {
  label: 'Free',
  type: 'free' as const,
  price: 0,
  description: 'For personal use',
  currency: 'USD',
  limits: {
    maxAgents: 1,
    maxDatastores: 3, // Enhanced from 1 to 3
    maxAgentQueries: 100,
    maxStoredTokens: 0,
    maxFileSize: 1000000, // 1MB
    maxSeats: 1,
    maxWebsiteURL: 25,
  },
}
```

### Level 0.5 - Hobby Plan

```typescript
level_0_5: {
  label: 'Hobby',
  type: 'hobby' as const,
  price: 10,
  description: 'For hobbyists',
  currency: 'USD',
  limits: {
    maxAgents: 2,
    maxDatastores: 2,
    maxAgentQueries: 2500,
    maxStoredTokens: 10000000,
    maxFileSize: 5000000, // 5MB
    maxSeats: 1,
    maxWebsiteURL: 100,
  },
}
```

### Level 1 - Growth Plan

```typescript
level_1: {
  label: 'Growth',
  type: 'growth' as const,
  price: 25,
  description: 'For growing businesses',
  currency: 'USD',
  limits: {
    maxAgents: 2,
    maxDatastores: 2,
    maxAgentQueries: 5000,
    maxStoredTokens: 20000000,
    maxFileSize: 10000000, // 10MB
    maxSeats: 1,
    maxWebsiteURL: 500,
  },
}
```

### Level 2 - Business Plan

```typescript
level_2: {
  label: 'Business',
  type: 'business' as const,
  price: 100,
  description: 'For businesses',
  currency: 'USD',
  limits: {
    maxAgents: 10,
    maxDatastores: 10,
    maxAgentQueries: 20000,
    maxStoredTokens: 100000000,
    maxFileSize: 20000000, // 20MB
    maxSeats: 5,
    maxWebsiteURL: 2500,
  },
}
```

### Level 3 - Enterprise Plan

```typescript
level_3: {
  label: 'Enterprise',
  type: 'enterprise' as const,
  price: 300,
  description: 'For enterprises',
  currency: 'USD',
  limits: {
    maxAgents: 100,
    maxDatastores: 100,
    maxAgentQueries: 100000,
    maxStoredTokens: 300000000,
    maxFileSize: 50000000, // 50MB
    maxSeats: 200,
    maxWebsiteURL: 10000,
  },
}
```

### Level 4 - Custom Plan

```typescript
level_4: {
  label: 'Custom',
  type: 'custom' as const,
  price: null,
  description: 'Custom plan',
  currency: 'USD',
  limits: {
    maxAgents: 1000,
    maxDatastores: 1000,
    maxAgentQueries: -1, // Unlimited
    maxStoredTokens: -1, // Unlimited
    maxFileSize: 100000000, // 100MB
    maxSeats: -1, // Unlimited
    maxWebsiteURL: -1, // Unlimited
  },
}
```

## User Premium Status

Users are considered premium based on their active subscriptions:

```typescript
// Premium status determination
const isPremium = Number(user?.subscriptions?.length) > 0;

// Subscription check
const hasActiveSubscription = user?.subscriptions?.some(
  (subscription) => subscription.status === 'active'
);
```

### Premium User Benefits

- Access to higher usage limits
- Advanced features
- Priority support
- Extended file upload sizes
- Multiple team seats
- API access

## Credits and Usage System

The system tracks various usage metrics that reset monthly:

### Tracked Usage Metrics

1. **Agent Queries** (`nbAgentQueries`) - Monthly reset
2. **Datastore Queries** (`nbDatastoreQueries`) - Monthly reset
3. **Data Processing Bytes** (`nbDataProcessingBytes`) - Monthly reset
4. **Uploaded Bytes** (`nbUploadedBytes`) - Monthly reset
5. **Model Tokens** (`nbModelTokens`) - Monthly reset
6. **Stored Tokens** (`nbStoredTokens`) - Permanent (no reset)

### Usage Reset Schedule

Monthly resets are handled by a GitHub Actions cron job:

```typescript
// File: /api/crons/reset-usage.ts
// Runs monthly via GitHub Actions
// Resets: nbAgentQueries, nbDataProcessingBytes, etc.
// Does NOT reset: nbStoredTokens (permanent storage limit)
```

### Usage Enforcement

Usage limits are enforced in real-time:

```typescript
// Example usage check
const currentUsage = await getUserUsage(userId);
const planLimits = getAccountConfig(userPlan);

if (currentUsage.nbAgentQueries >= planLimits.maxAgentQueries) {
  throw new Error('Monthly query limit exceeded');
}
```

## Implementation Work Completed

This section documents the comprehensive implementation work completed to enhance the premium system, create user management tools, and improve the free tier experience.

### 1. Enhanced Free Tier Implementation

**Problem**: The original free tier only allowed 1 datastore, which was too restrictive for users to properly evaluate the platform.

**Solution**: Enhanced the free tier to allow 3 datastores, making it more premium-like and providing better user experience.

**Implementation**:

```typescript
// File: packages/lib/account-config.ts
// Changed from:
level_0: {
  limits: {
    maxDatastores: 1, // Original
  }
}

// Changed to:
level_0: {
  limits: {
    maxDatastores: 3, // Enhanced
  }
}
```

**Impact**: Free users can now create up to 3 datastores, allowing them to better explore and evaluate the platform before upgrading.

### 2. User Management Script System

**Problem**: No efficient way to create test users, modify subscriptions, or manage user accounts for testing and administration.

**Solution**: Created a comprehensive suite of user management scripts with convenient npm shortcuts.

**Scripts Created**:

1. **setup-premium-test-user.ts** - Create premium test users with any plan level
2. **modify-user-subscription.ts** - Change existing user subscription plans and status
3. **view-user-details.ts** - Display comprehensive user information including limits and usage
4. **reset-user-usage.ts** - Reset usage counters for testing purposes
5. **cleanup-test-user.ts** - Remove test users and all associated data
6. **demo-user-management.ts** - Demonstrate all user management features
7. **create-test-prices.ts** - Create test price records to bypass Stripe dependency

**Features**:

- Automatic organization and API key creation
- Trial period management (set to 1 year for testing)
- Usage counter reset for clean testing
- Comprehensive error handling and validation
- Detailed output with user IDs and cleanup instructions

### 3. Database Seeding and Price Management

**Problem**: The original seeding system required Stripe API keys and made external API calls, making development setup complex.

**Solution**: Created a bypass system that generates test price records locally without requiring Stripe.

#### Why Bypass Stripe?

1. **Development Efficiency**: No need for Stripe API keys during development
2. **Testing Isolation**: Tests don't depend on external services
3. **Environment Flexibility**: Can work in any environment without Stripe setup
4. **Cost Control**: No accidental charges during testing

#### How the Bypass Works

**Original Seed Process**:

```typescript
// Original: packages/prisma/seed.ts
const products = await stripe.products.list(); // Requires Stripe API
const prices = await stripe.prices.list(); // Requires Stripe API
```

**Bypass Implementation**:

```typescript
// New: create-test-prices.ts
const products = [
  {
    id: 'prod_test_free',
    name: 'Free Plan',
    description: 'Free tier with basic features',
    active: true,
  },
  // ... more test products
];

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
  // ... more test prices
];
```

**Key Benefits**:

- No external API dependencies
- Instant setup
- Predictable test data
- Works offline
- No billing concerns

### 4. Environment Variable Management

**Problem**: Scripts weren't properly loading environment variables from `.env.local`.

**Solution**: Implemented proper dotenv loading with consistent patterns across all scripts.

**Implementation**:

```json
// apps/dashboard/package.json
{
  "scripts": {
    "dotenv": "dotenv -e ../../.env.local",
    "user:create-premium": "npm run dotenv -- tsx scripts/user-plan-manage/setup-premium-test-user.ts"
    // ... other scripts
  }
}
```

**Pattern Used**:

```bash
# All scripts follow this pattern:
npm run dotenv -- tsx scripts/path/to/script.ts [args]
```

### 5. Convenient Script Shortcuts

**Problem**: Long command paths made user management cumbersome.

**Solution**: Created convenient npm shortcuts at both root and app levels.

**Root Level Shortcuts** (`package.json`):

```json
{
  "scripts": {
    "user:create-premium": "cd apps/dashboard && npm run user:create-premium",
    "user:modify": "cd apps/dashboard && npm run user:modify",
    "user:view": "cd apps/dashboard && npm run user:view",
    "user:reset-usage": "cd apps/dashboard && npm run user:reset-usage",
    "user:cleanup": "cd apps/dashboard && npm run user:cleanup",
    "user:demo": "cd apps/dashboard && npm run user:demo",
    "user:create-test-prices": "cd apps/dashboard && npm run user:create-test-prices"
  }
}
```

**Usage Examples**:

```bash
# From anywhere in the project:
pnpm user:create-premium test@example.com level_3
pnpm user:view test@example.com
pnpm user:modify test@example.com level_2
```

## Database Seeding and Price Management

### For New Environments

When deploying to a new environment with a fresh database, follow these steps:

#### Option 1: Using Test Prices (Recommended for Development)

```bash
# 1. Push database schema
cd packages/prisma
npm run prisma:push

# 2. Create test price records (bypasses Stripe)
pnpm user:create-test-prices

# 3. Verify prices were created
pnpm user:create-premium test@example.com level_3
```

#### Option 2: Using Real Stripe Data (Production)

```bash
# 1. Set up Stripe API key in .env.local
echo "STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key" >> .env.local

# 2. Push database schema
cd packages/prisma
npm run prisma:push

# 3. Run full Stripe seed
npm run prisma:seed

# 4. Create test users with real pricing
pnpm user:create-premium test@example.com level_3
```

### Price Record Structure

The system expects these price records in the database:

```sql
-- Products table
INSERT INTO products (id, name, description, active) VALUES
('prod_test_free', 'Free Plan', 'Free tier with basic features', true),
('prod_test_enterprise', 'Enterprise Plan', 'Enterprise tier with full features', true);

-- Prices table
INSERT INTO prices (id, product_id, currency, active, type, unit_amount, interval, interval_count) VALUES
('price_test_free', 'prod_test_free', 'usd', true, 'recurring', 0, 'month', 1),
('price_test_enterprise', 'prod_test_enterprise', 'usd', true, 'recurring', 29999, 'month', 1);
```

### Why This Approach?

1. **Simplicity**: Minimal setup required for development
2. **Flexibility**: Works with or without Stripe
3. **Speed**: Instant database setup
4. **Reliability**: No external dependencies for basic functionality
5. **Cost-Effective**: No accidental Stripe charges during development

## User Management Scripts

### Script Overview

All user management scripts are located in `apps/dashboard/scripts/user-plan-manage/` and can be run using convenient npm shortcuts.

### 1. Creating Premium Test Users

```bash
# Create with default settings (level_3/Enterprise plan)
pnpm user:create-premium test@example.com

# Create with specific plan
pnpm user:create-premium test@example.com level_2

# Create free tier user (enhanced with 3 datastores)
pnpm user:create-premium free-user@example.com level_0
```

**Features**:

- Generates unique user, organization, and API key IDs
- Creates active subscription with trial period
- Resets all usage counters to 0
- Provides cleanup instructions

### 2. Viewing User Details

```bash
pnpm user:view test@example.com
```

**Output Includes**:

- User profile information
- Organization details and API keys
- Subscription status and plan details
- Plan limits vs current usage
- List of agents and datastores
- Premium status

### 3. Modifying User Subscriptions

```bash
# Upgrade user to Enterprise plan
pnpm user:modify user@example.com level_3

# Downgrade user to free plan
pnpm user:modify user@example.com level_0

# Set specific status
pnpm user:modify user@example.com level_2 active
pnpm user:modify user@example.com level_1 canceled
```

### 4. Resetting User Usage

```bash
pnpm user:reset-usage test@example.com
```

**Resets**:

- Agent queries count
- Datastore queries count
- Uploaded bytes
- Data processing bytes
- Model tokens
- Stored tokens (optional)
- Notification flags

### 5. Cleanup Test Users

```bash
# Get user ID from view-user-details first
pnpm user:view test@example.com

# Cleanup using user ID
pnpm user:cleanup test-user-1234567890
```

**Removes**:

- User account
- Organizations and memberships
- Subscriptions and customers
- API keys
- Agents and datastores
- All related data (cascading delete)

### 6. Demo and Testing

```bash
# Run comprehensive demo
pnpm user:demo
```

**Demonstrates**:

- Creating users with different plans
- Viewing detailed information
- Modifying subscriptions
- Usage tracking
- Cleanup procedures

## Deployment Guide

### Prerequisites

1. **Database**: PostgreSQL instance
2. **Environment Variables**: Properly configured `.env.local`
3. **Dependencies**: Node.js, pnpm, and project dependencies

### Step-by-Step Deployment

#### 1. Environment Setup

```bash
# Clone and install dependencies
git clone <repository>
cd databerry
pnpm install

# Copy environment template
cp .env.example .env.local
```

#### 2. Configure Environment Variables

```bash
# Edit .env.local with your values:

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Auth (generate secure secrets)
NEXTAUTH_SECRET=your_secure_secret_here
JWT_SECRET=your_jwt_secret_here

# Optional: Stripe (for production billing)
STRIPE_SECRET_KEY=sk_live_your_stripe_key

# Other services as needed...
```

#### 3. Database Initialization

```bash
# Push database schema
cd packages/prisma
npm run prisma:push

# Option A: Create test prices (development)
cd ../..
pnpm user:create-test-prices

# Option B: Seed with Stripe (production)
# Ensure STRIPE_SECRET_KEY is set first
cd packages/prisma
npm run prisma:seed
```

#### 4. Verify Installation

```bash
# Create a test user
pnpm user:create-premium admin@yourdomain.com level_3

# View user details
pnpm user:view admin@yourdomain.com

# Check database connectivity
cd packages/prisma
npm run prisma -- db pull
```

#### 5. Start Services

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

### Environment-Specific Considerations

#### Development Environment

```bash
# Use test prices for faster setup
pnpm user:create-test-prices

# Create development users
pnpm user:create-premium dev@example.com level_0    # Free tier testing
pnpm user:create-premium premium@example.com level_3 # Premium testing
```

#### Staging Environment

```bash
# Use real Stripe data but test mode
STRIPE_SECRET_KEY=sk_test_your_test_key

# Create realistic test data
cd packages/prisma
npm run prisma:seed

# Create test users for staging
pnpm user:create-premium staging@example.com level_2
```

#### Production Environment

```bash
# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_your_live_key

# Full Stripe seed
cd packages/prisma
npm run prisma:seed

# Create initial admin user
pnpm user:create-premium admin@yourdomain.com level_3
```

### Migration from Existing Environment

If migrating from an existing environment:

```bash
# 1. Export data from old database
pg_dump old_database > backup.sql

# 2. Set up new environment
# Follow steps 1-3 above

# 3. Import data (skip if starting fresh)
psql new_database < backup.sql

# 4. Update schema if needed
cd packages/prisma
npm run prisma:db push

# 5. Verify users and pricing
pnpm user:view existing@user.com
```

## Testing and Verification

### Manual Testing Checklist

#### 1. Free Tier Enhancement Testing

```bash
# Create free tier user
pnpm user:create-premium free@example.com level_0

# Verify enhanced limits
pnpm user:view free@example.com
# Should show: "Max Datastores: 3" (enhanced from 1)
```

#### 2. Premium User Testing

```bash
# Create premium user
pnpm user:create-premium premium@example.com level_3

# Verify premium features
pnpm user:view premium@example.com
# Should show: Enterprise limits and premium status
```

#### 3. Subscription Management Testing

```bash
# Test plan changes
pnpm user:modify premium@example.com level_1  # Downgrade
pnpm user:view premium@example.com            # Verify change
pnpm user:modify premium@example.com level_3  # Upgrade back
```

#### 4. Usage Tracking Testing

```bash
# Reset usage for clean testing
pnpm user:reset-usage premium@example.com

# Verify reset
pnpm user:view premium@example.com
# All usage counters should be 0
```

#### 5. Cleanup Testing

```bash
# Get user ID
pnpm user:view premium@example.com

# Cleanup user (use actual ID from output)
pnpm user:cleanup test-user-1234567890

# Verify removal
pnpm user:view premium@example.com
# Should show "User not found"
```

### Automated Testing

The scripts include built-in validation and error handling:

```typescript
// Example from setup-premium-test-user.ts
try {
  // Check if prices exist
  const existingPrice = await prisma.price.findFirst();
  if (!existingPrice) {
    throw new Error(
      'No price found in database. Please ensure prices are seeded first.'
    );
  }

  // Create user with validation
  const user = await prisma.user.create({
    data: {
      /* validated data */
    },
  });
} catch (error) {
  console.error('❌ Error creating user:', error);
  process.exit(1);
}
```

### Integration Testing

For testing the complete flow:

```bash
# Run the demo script which tests everything
pnpm user:demo

# Expected output:
# ✅ Price records validation
# ✅ User creation (multiple plans)
# ✅ User details viewing
# ✅ Subscription modification
# ✅ Usage reset
# ✅ Cleanup procedures
```

### Troubleshooting Common Issues

#### 1. "No price found in database"

```bash
# Solution: Create test prices
pnpm user:create-test-prices
```

#### 2. "User not found"

```bash
# Solution: Check email spelling and create user first
pnpm user:create-premium user@example.com level_0
```

#### 3. Database connection issues

```bash
# Solution: Verify DATABASE_URL and database status
cd packages/prisma
npm run prisma -- db pull
```

#### 4. Permission errors

```bash
# Solution: Ensure database user has proper permissions
# Check database connection and schema access
```

## Best Practices

### Security Considerations

1. **API Keys**: Generated keys are for testing only - use secure generation in production
2. **Database Access**: Ensure proper database permissions and network security
3. **Environment Variables**: Never commit real credentials to version control
4. **User Data**: Follow GDPR/privacy requirements when handling user data

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on user_id, email, subscription fields
2. **Usage Tracking**: Consider caching frequent usage queries
3. **Batch Operations**: Use batch operations for bulk user management

### Monitoring and Maintenance

1. **Usage Monitoring**: Track subscription usage and plan distribution
2. **Error Logging**: Monitor script execution for errors
3. **Database Health**: Regular database maintenance and backup
4. **Subscription Sync**: Ensure Stripe and database remain synchronized

## Conclusion

This implementation provides a robust, flexible system for managing premium subscriptions and users in the Chaindesk platform. The enhanced free tier, comprehensive user management scripts, and deployment tools make it easy to test, deploy, and maintain the premium features across different environments.

The bypass system for Stripe integration allows for rapid development and testing without external dependencies, while maintaining compatibility with production Stripe integration when needed.
