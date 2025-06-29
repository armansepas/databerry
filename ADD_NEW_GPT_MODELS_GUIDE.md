# Adding New GPT Models to Databerry - Complete Guide

## Overview

This document details the complete process of adding new GPT models (`gpt_4o_mini` and `gpt_4_1_mini`) to the Databerry application.

**Date:** June 29, 2025  
**Models Added:** GPT-4o Mini, GPT-4.1 Mini  
**Database:** PostgreSQL with Prisma ORM

---

## 🎯 What We Accomplished

Successfully added two new GPT models to the Databerry platform:

- **GPT-4o Mini** - Ultra-affordable model with vision support
- **GPT-4.1 Mini** - Next-generation mini model

**Key Features Added:**

- ✅ Database schema updated with new enum values
- ✅ Model configurations with pricing and capabilities
- ✅ UI dropdown options for model selection
- ✅ No premium subscription required for these models

---

## 📋 Step-by-Step Process

### Step 1: Update Prisma Schema

**File:** `/packages/prisma/schema.prisma`

**What was done:** Added new enum values to `AgentModelName`

```prisma
enum AgentModelName {
  gpt_3_5_turbo
  gpt_3_5_turbo_16k
  gpt_4
  gpt_4_32k
  gpt_4_turbo
  gpt_4_turbo_vision
  gpt_4o_mini          // ← NEW
  gpt_4_1_mini         // ← NEW
  claude_3_haiku
  claude_3_sonnet
  claude_3_opus
  mixtral_8x7b
  mixtral_8x22b
  dolphin_mixtral_8x7b
}
```

### Step 2: Database Migration/Update

**Commands executed:**

```bash
# Navigate to Prisma directory
cd /home/arman/arman/code/other/databerry/packages/prisma

# First attempt - failed due to missing DATABASE_URL
npx prisma migrate dev --name add_new_gpt_models
# Error: Environment variable not found: DATABASE_URL

# Second attempt - with environment variable
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma migrate dev --name add_new_gpt_models
# Detected schema drift, suggested reset (we declined)

# Final solution - direct schema push (worked perfectly)
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma db push
# ✅ Success: Database updated, Prisma Client generated
```

**⚠️ IMPORTANT MISSING STEP:** We used `db push` but didn't create a migration file! This was corrected afterward.

### Step 2.1: Create Migration File (CORRECTED AFTERWARD)

Since we used `db push`, we missed creating a proper migration file for version control. Here's how we fixed it:

**Commands executed:**

```bash
# Create migration directory
cd /home/arman/arman/code/other/databerry/packages/prisma/migrations
mkdir -p "20250629105243_add_gpt_4o_mini_and_gpt_4_1_mini"

# Create migration SQL file
cat > 20250629105243_add_gpt_4o_mini_and_gpt_4_1_mini/migration.sql << 'EOF'
-- AlterEnum
ALTER TYPE "AgentModelName" ADD VALUE 'gpt_4o_mini';

-- AlterEnum
ALTER TYPE "AgentModelName" ADD VALUE 'gpt_4_1_mini';
EOF

# Mark migration as already applied (since we used db push)
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma migrate resolve --applied 20250629105243_add_gpt_4o_mini_and_gpt_4_1_mini
```

**Key Learning:** For enum additions, `prisma db push` is often simpler than `migrate dev` because PostgreSQL handles adding enum values gracefully.

**⚠️ IMPORTANT MISSING STEP:** We used `db push` but didn't create a migration file! This was corrected afterward.

### Step 3: Add Model Configurations

**File:** `/packages/lib/config.ts`

**Problem Encountered:** Duplicate entries were created causing TypeScript errors:

```
An object literal cannot have multiple properties with the same name.
```

**Solution:** Removed duplicate entries and added proper configurations:

```typescript
export const ModelConfig: Record<AgentModelName, {...}> = {
  // ...existing models...

  [AgentModelName.gpt_4o_mini]: {
    name: 'gpt-4o-mini',
    maxTokens: 128000,
    cost: 0.5,                           // Very affordable
    providerPriceByInputToken: 0.00000015,
    providerPricePriceByOutputToken: 0.0000006,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
  },
  [AgentModelName.gpt_4_1_mini]: {
    name: 'gpt-4.1-mini',
    maxTokens: 128000,
    cost: 0.5,                           // Very affordable
    providerPriceByInputToken: 0.00000015,
    providerPricePriceByOutputToken: 0.0000006,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
  },
  // ...rest of models...
};
```

**Code Fix Applied:**

```typescript
// Removed these duplicate entries:
[AgentModelName.gpt_4o_mini]: { /* duplicate config */ },
[AgentModelName.gpt_4_1_mini]: { /* duplicate config */ },
```

### Step 4: Update UI Components

**File:** `/apps/dashboard/components/AgentInputs/ModelInput.tsx`

**Added UI Options:**

```tsx
<Option value={AgentModelName.gpt_4o_mini}>
  <ProviderLogo src={ModelConfig[AgentModelName.gpt_4o_mini].icon} />
  GPT-4o Mini - 128k - {ModelConfig[AgentModelName.gpt_4o_mini].cost}{' '}
  credit/query
</Option>

<Option value={AgentModelName.gpt_4_1_mini}>
  <ProviderLogo src={ModelConfig[AgentModelName.gpt_4_1_mini].icon} />
  GPT-4.1 Mini - 128k - {ModelConfig[AgentModelName.gpt_4_1_mini].cost}{' '}
  credit/query
</Option>
```

---

## 🔧 Commands Reference

### Database Operations

```bash
# Check Prisma schema
cd /home/arman/arman/code/other/databerry/packages/prisma

# Option 1: Create migration (for production)
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma migrate dev --name add_new_gpt_models

# Option 2: Push schema directly (for development) - USED
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma db push

# Verify new enum values in database
psql -h localhost -U admin -d databerry -c "SELECT unnest(enum_range(NULL::\"AgentModelName\")) as model_name;"
```

### Verification Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Test specific files
npx tsc --noEmit packages/lib/config.ts
npx tsc --noEmit apps/dashboard/components/AgentInputs/ModelInput.tsx
```

---

## 🐛 Errors Encountered & Solutions

### Error 1: Missing DATABASE_URL

```
Error: Environment variable not found: DATABASE_URL.
```

**Solution:** Set environment variable inline with command:

```bash
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry" npx prisma [command]
```

### Error 2: Schema Drift Detection

```
Drift detected: Your database schema is not in sync with your migration history.
? We need to reset the "public" schema at "localhost:5432"
Do you want to continue? All data will be lost.
```

**Solution:** Used `prisma db push` instead of `migrate dev` to avoid data loss.

### Error 3: Duplicate Object Properties

```
An object literal cannot have multiple properties with the same name.
```

**Solution:** Removed duplicate entries in `ModelConfig` object:

```typescript
// Removed duplicate:
[AgentModelName.gpt_4o_mini]: { ... },
[AgentModelName.gpt_4_1_mini]: { ... },
```

### Error 4: Missing Migration File (IMPORTANT!)

**Problem:** Using `prisma db push` updates the database but doesn't create migration files for version control.

**Why this matters:**

- No migration file means other developers can't apply the same changes
- Production deployments won't have the migration
- Version control doesn't track database schema changes

**Solution:** Create migration file manually and mark as applied:

```bash
# 1. Create migration directory
mkdir -p "YYYYMMDDHHMMSS_descriptive_name"

# 2. Create migration.sql file with the changes
cat > migration_dir/migration.sql << 'EOF'
-- AlterEnum
ALTER TYPE "AgentModelName" ADD VALUE 'new_model_name';
EOF

# 3. Mark migration as applied (since db push already applied it)
npx prisma migrate resolve --applied migration_name
```

---

## 📁 Files Modified

### 1. `/packages/prisma/schema.prisma`

- Added `gpt_4o_mini` and `gpt_4_1_mini` to `AgentModelName` enum

### 2. `/packages/lib/config.ts`

- Added model configurations for new GPT models
- Fixed duplicate entries issue

### 3. `/apps/dashboard/components/AgentInputs/ModelInput.tsx`

- Added UI dropdown options for new models
- Configured as non-premium options

### 4. `/packages/prisma/migrations/20250629105243_add_gpt_4o_mini_and_gpt_4_1_mini/migration.sql` (CREATED AFTERWARD)

- Created proper migration file for version control
- Contains SQL commands to add new enum values

---

## 🧪 Testing & Verification

### Database Verification

```sql
-- Verify enum values are available
SELECT unnest(enum_range(NULL::"AgentModelName")) as model_name;

-- Expected output includes:
-- gpt_4o_mini
-- gpt_4_1_mini
```

### Application Testing

1. ✅ TypeScript compilation passes
2. ✅ Database schema updated successfully
3. ✅ New models appear in agent creation UI
4. ✅ Model configurations load correctly

---

## 💡 Key Learnings

### Prisma Migrations vs DB Push

- **`prisma migrate dev`**: Creates migration files, better for production
- **`prisma db push`**: Direct schema changes, better for development
- **For enum additions**: `db push` is often simpler and safer

### Model Configuration Best Practices

- Always add configurations in `ModelConfig` object
- Include all required properties: `name`, `maxTokens`, `cost`, etc.
- Set appropriate pricing based on OpenAI's actual costs
- Enable features like `hasVision` and `isToolCallingSupported` as appropriate

### UI Integration

- Add options to `ModelInput.tsx` component
- Consider premium vs non-premium status
- Include context length and pricing in display text

---

## 🔄 Future Reference

To add more models in the future:

1. **Update enum** in `schema.prisma`
2. **Run** `prisma db push` (development) or `prisma migrate dev` (production)
3. **🔴 CREATE MIGRATION FILE** (if using `db push`)

   ```bash
   # Create migration directory
   mkdir -p "$(date +%Y%m%d%H%M%S)_descriptive_name"

   # Create migration.sql with ALTER TYPE statements
   # Mark as applied: npx prisma migrate resolve --applied [migration_name]
   ```

4. **Add configuration** in `config.ts`
5. **Add UI option** in `ModelInput.tsx`
6. **Test** TypeScript compilation and functionality

**Environment Variables Needed:**

```bash
DATABASE_URL="postgresql://admin:password@localhost:5432/databerry"
```

**Docker Environment File:** `/docker/docker.env` contains database credentials.

---

## 📊 Model Specifications Added

| Model        | Name           | Context | Cost        | Vision | Tools | Premium |
| ------------ | -------------- | ------- | ----------- | ------ | ----- | ------- |
| GPT-4o Mini  | `gpt-4o-mini`  | 128k    | 0.5 credits | ✅     | ✅    | ❌      |
| GPT-4.1 Mini | `gpt-4.1-mini` | 128k    | 0.5 credits | ✅     | ✅    | ❌      |

---

_This guide provides a complete reference for adding new GPT models to the Databerry platform. Keep this document updated when making similar changes in the future._
