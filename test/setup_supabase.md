# Supabase Setup Instructions

## ⚠️ Important: Manual Setup Required

The tables need to be created in your Supabase project. Please follow these steps:

## Step 1: Access Supabase Dashboard

1. Go to: https://app.supabase.com/project/qctdaaezghvqnbpghinr
2. Navigate to **SQL Editor** in the left sidebar

## Step 2: Create Tables

Copy and execute the following SQL in the SQL Editor:

### Execute Migration 1: Initial Schema
Copy the entire content of `/supabase/migrations/001_initial_schema.sql` and run it in the SQL Editor.

### Execute Migration 2: RLS Policies
Copy the entire content of `/supabase/migrations/002_rls_policies.sql` and run it in the SQL Editor.

## Step 3: Enable Authentication Providers

1. Go to **Authentication** → **Providers**
2. Enable:
   - Email/Password
   - Google (optional)
   - GitHub (optional)

## Step 4: Configure Edge Functions

1. Go to **Edge Functions** in the sidebar
2. Create a new function named `invitation-system`
3. Copy the content from `/supabase/functions/invitation-system/index.ts`

## Alternative: Local Testing Without Supabase

For testing purposes without Supabase, we can create a mock environment: