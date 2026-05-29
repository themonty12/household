# Deployment Checklist

Use this checklist for the Household Finance MVP production setup on Supabase and Vercel.

## Supabase

1. Create a new Supabase project for the MVP environment.
2. In Authentication settings, disable public sign-up so access stays invite-only.
3. Apply the database migrations from `supabase/migrations`.
4. Create the first user in Supabase Auth.
5. Insert the initial household and admin profile using the first-admin SQL note at the end of `supabase/migrations/0001_initial_schema.sql`. Replace `AUTH_USER_UUID` with the UUID from the Auth user created in the previous step.
6. Confirm row level security is enabled on the finance tables: `households`, `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `monthly_snapshots`, and `monthly_closes`.
7. Confirm write policies match the MVP roles: account/category/budget/monthly close administration is admin-only, while household members can read household data and create their own transactions.

## Vercel

1. Import the repository in Vercel and deploy from the repository root.
2. Set the build command to `npm run build`.
3. Add these environment variables for Production, Preview, and any environment used for testing:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Set `NEXT_PUBLIC_APP_URL` to the deployed app URL for the environment, including the protocol.
5. Deploy after the Supabase project, migrations, Auth user, and admin profile are ready.

## Before Deployment

Run these checks from the repository root:

```bash
npm run test
npm run build
npm run test:e2e
```

For local build verification without production secrets, use placeholder Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key SUPABASE_SERVICE_ROLE_KEY=test-service-role-key NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100 npm run build
```

## After Deployment

1. Visit the deployed `NEXT_PUBLIC_APP_URL`.
2. Verify the login flow with the seeded admin user.
3. Check the main MVP routes:
   - `/today`
   - `/assets`
   - `/monthly-close`
   - `/settings`
4. Run a sample flow:
   - create an account in `/settings`
   - create an income or expense category in `/settings`
   - add a transaction in `/today`
   - verify balances and totals on `/assets`
   - generate or regenerate a monthly close in `/monthly-close`
5. Confirm admin-only behavior:
   - `/settings` is admin-only.
   - Monthly close regenerate actions are admin-only.
   - Non-admin users cannot edit admin-managed setup data.
