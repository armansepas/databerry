# User Plan Management Scripts

This directory contains scripts to manage users, subscriptions, and usage for testing and administration purposes.

## Location

These scripts are organized in `apps/dashboard/scripts/user-plan-manage/` within the workspace so they can properly access the `@chaindesk/prisma` package and other workspace dependencies. This keeps them separate from other dashboard scripts for better organization.

## Prerequisites

Make sure you have the database running and properly configured. You can use tsx to run these TypeScript scripts directly.

## Running Scripts

You can run scripts in several ways:

### From the root directory:

```bash
pnpm user:view test@example.com
pnpm user:create-premium test@example.com level_3
```

### From the dashboard directory:

```bash
cd apps/dashboard
npm run user:view test@example.com
npm run user:create-premium test@example.com level_3
```

### Directly with tsx:

```bash
cd apps/dashboard
npx tsx scripts/user-plan-manage/view-user-details.ts test@example.com
npx tsx scripts/user-plan-manage/setup-premium-test-user.ts test@example.com level_3
cd apps/dashboard
npx tsx scripts/view-user-details.ts test@example.com
```

## Available Scripts

### 1. Setup Premium Test User

**File:** `setup-premium-test-user.ts`

Creates a new premium test user with full access for testing purposes.

```bash
# Create with default settings (level_3/Enterprise plan)
npx tsx scripts/user-plan-manage/setup-premium-test-user.ts test@example.com

# Create with specific plan
npx tsx scripts/user-plan-manage/setup-premium-test-user.ts test@example.com level_2

# Create with default email and plan
npx tsx scripts/user-plan-manage/setup-premium-test-user.ts
```

**Features:**

- Creates user with specified email and plan
- Sets up organization with API key
- Creates active subscription
- Resets all usage counters to 0
- Sets trial end date 1 year in the future

### 2. Modify User Subscription

**File:** `modify-user-subscription.ts`

Modifies an existing user's subscription plan and status.

```bash
# Upgrade user to Enterprise plan
npx tsx scripts/user-plan-manage/modify-user-subscription.ts user@example.com level_3

# Downgrade user to free plan
npx tsx scripts/user-plan-manage/modify-user-subscription.ts user@example.com level_0

# Set specific status
npx tsx scripts/user-plan-manage/modify-user-subscription.ts user@example.com level_2 active
npx tsx scripts/user-plan-manage/modify-user-subscription.ts user@example.com level_1 canceled
```

**Available Plans:**

- `level_0` - Free (1 datastore, 1 agent, 100 queries)
- `level_0_5` - Hobby (2 datastores, 2 agents, 2,500 queries)
- `level_1` - Growth (2 datastores, 2 agents, 5,000 queries)
- `level_2` - Pro (10 datastores, 5 agents, 10,000 queries)
- `level_3` - Enterprise (100 datastores, 100 agents, 100,000 queries)
- `level_4` - Ultimate (200 datastores, 200 agents, 200,000 queries)

**Available Statuses:**

- `active` - Active subscription
- `canceled` - Canceled subscription
- `trialing` - Trial period
- `past_due` - Payment past due
- `incomplete` - Incomplete payment
- `unpaid` - Unpaid subscription

### 3. View User Details

**File:** `view-user-details.ts`

Displays comprehensive information about a user including subscription status, usage, and resources.

```bash
npx tsx scripts/user-plan-manage/view-user-details.ts user@example.com
```

**Shows:**

- User profile information
- Organization details and API keys
- Subscription status and plan details
- Plan limits and current usage
- List of agents and datastores

### 4. Reset User Usage

**File:** `reset-user-usage.ts`

Resets all usage counters for a user to 0, useful for testing.

```bash
npx tsx scripts/user-plan-manage/reset-user-usage.ts user@example.com
```

**Resets:**

- Agent queries count
- Datastore queries count
- Uploaded bytes
- Data processing bytes
- Model tokens
- Stored tokens
- Notification flags

### 5. Cleanup Test User

**File:** `cleanup-test-user.ts`

Removes a test user and all associated data (organizations, subscriptions, agents, datastores, etc.).

```bash
npx tsx scripts/user-plan-manage/cleanup-test-user.ts test-user-1234567890
```

**Warning:** This permanently deletes all data associated with the user ID.

## Common Workflows

### Testing Premium Features

1. **Create a premium test user:**

   ```bash
   npx tsx scripts/setup-premium-test-user.ts premium-test@chaindesk.ai level_3
   ```

2. **View the user details:**

   ```bash
   npx tsx scripts/view-user-details.ts premium-test@chaindesk.ai
   ```

3. **Test usage limits by modifying plan:**

   ```bash
   npx tsx scripts/modify-user-subscription.ts premium-test@chaindesk.ai level_0
   ```

4. **Reset usage for clean testing:**

   ```bash
   npx tsx scripts/reset-user-usage.ts premium-test@chaindesk.ai
   ```

5. **Cleanup when done:**
   ```bash
   # Get the user ID from view-user-details output first
   npx tsx scripts/cleanup-test-user.ts test-user-1234567890
   ```

### Upgrading Existing User

1. **Check current status:**

   ```bash
   npx tsx scripts/view-user-details.ts existing@user.com
   ```

2. **Upgrade to premium:**

   ```bash
   npx tsx scripts/modify-user-subscription.ts existing@user.com level_2
   ```

3. **Verify the change:**
   ```bash
   npx tsx scripts/view-user-details.ts existing@user.com
   ```

### Testing Free Tier Improvements

The free tier has been enhanced to include 3 datastores instead of 1. Test this by:

1. **Create a free user:**

   ```bash
   npx tsx scripts/modify-user-subscription.ts test@example.com level_0
   ```

2. **Verify they can create 3 datastores through the UI**

## Important Notes

- Always test changes in a development environment first
- The scripts automatically handle database relationships and constraints
- Usage counters are reset when modifying subscriptions for clean testing
- Test users are created with trial periods set far in the future
- Cleanup scripts cascade delete all related data

## Troubleshooting

### Script fails with "No price found"

Make sure the database is properly seeded with price data:

```bash
npx prisma db seed
```

### User not found

Verify the email address is correct and the user exists in the database.

### Permission issues

Ensure the database connection has proper permissions and the schema is up to date:

```bash
npx prisma db push
```

## Security Considerations

- These scripts should only be used in development/testing environments
- API keys generated are for testing purposes only
- Never use these scripts in production without proper validation
- Always backup your database before running destructive operations
