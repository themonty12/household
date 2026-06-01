# Deployment Checklist

Use this checklist for the Household Finance MVP production setup on Supabase and Vercel.

## Supabase

1. Create a new Supabase project for the MVP environment.
2. In Authentication settings, disable public sign-up so access stays invite-only.
3. Apply the database migrations from `supabase/migrations` with the Supabase CLI:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   supabase migration list
   ```

   The project ref is in Supabase Dashboard > Project Settings > General. If the CLI is unavailable, use Dashboard > SQL Editor to run the migration SQL in order, then record which migration files were applied.
4. In Dashboard > Authentication > Users, create the first user with a confirmed email and password. Record the Auth user UUID.
5. Insert the initial household and admin profile using the first-admin SQL note at the end of `supabase/migrations/0001_initial_schema.sql`. Replace `AUTH_USER_UUID` with the UUID from the Auth user created in the previous step.
6. Create a second Auth user and profile with `role = 'member'` in the same household so non-admin behavior can be verified after deployment.
7. Seed the admin-managed accounts, income and expense categories, and monthly budgets through Supabase Dashboard > Table Editor or Dashboard > SQL Editor. The `/settings` page is setup guidance for this MVP, not CRUD.
8. Confirm row level security is enabled on the finance tables: `households`, `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `monthly_snapshots`, and `monthly_closes`.
9. Confirm write policies match the MVP roles: account/category/budget/monthly close administration is admin-only, while household members can read household data and create their own transactions.
10. Run the Supabase security and performance advisors after migrations from Dashboard > Database > Advisors and resolve any deployment-blocking findings.

## Vercel

1. Import the repository in Vercel and deploy from the repository root.
2. Set the build command to `npm run build`.
3. Add these environment variables for Production and any trusted environment used for testing:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Set `NEXT_PUBLIC_APP_URL` to the deployed app URL for the environment, including the protocol.
5. Copy Supabase values from Dashboard > Project Settings > API. Add them in Vercel > Project Settings > Environment Variables.
6. Deploy after the Supabase project, migrations, Auth users, profiles, accounts, categories, and budgets are ready.

## Before Deployment

Run these checks from the repository root:

```bash
npm run test
npm run build
npm run test:e2e
```

`npm run test:e2e` is currently a login smoke test, not a full seeded app flow. Keep the manual post-deploy checks below in the release checklist.

For local build verification without production secrets, prefer a temporary `.env.local` with placeholder values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
```

Then run:

```bash
npm run build
```

PowerShell one-off equivalent:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='test-anon-key'
$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:3100'
npm run build
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
   - confirm the seeded accounts, categories, and budgets appear in the app
   - add a transaction in `/today`
   - verify balances and totals on `/assets`
   - generate or regenerate a monthly close in `/monthly-close`
5. Confirm admin-only behavior:
   - `/settings` is admin-only.
   - Monthly close regenerate actions are admin-only.
   - Non-admin users cannot edit admin-managed setup data.
6. Verify with the seeded member user:
   - `/settings` redirects away or is unavailable from navigation.
   - Monthly close regenerate controls are hidden or disabled.
   - Member transaction entry still works for allowed household data.
7. If deployment fails after migrations, roll back the Vercel deployment first. For database issues, apply a corrective migration rather than editing already-applied migration files.
