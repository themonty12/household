# Korean Settings MVP Design

## Goal

Make the app usable by Korean-speaking personal/family users and let household admins configure the basic data needed to start using the finance workflow without leaving the app.

## Scope

- Translate visible app UI copy to Korean by default.
- Keep database enum values in English for compatibility, but display Korean labels for account, category, and transaction types.
- Replace the current settings guidance page with admin controls for accounts, categories, and monthly budgets.
- Keep family invitation/user creation in Supabase Auth for this MVP. The settings page can show the current admin context, but it will not create Auth users.

## Settings Behavior

- Only admins can access `/settings` through the existing `requireAdmin()` guard.
- Accounts can be created and updated with name, type, current balance, net-worth inclusion, and status.
- Categories can be created and updated with name, type, sort order, and status.
- Monthly budgets can be upserted for a selected month and category.
- Archival uses the existing `status` column instead of deleting rows so historical transactions stay intact.

## Data Flow

- `getSettingsData()` reads accounts, categories, budgets, and household profiles for the current household.
- Server actions in `src/app/actions/settings.ts` validate form submissions with Zod, call `requireAdmin()`, write scoped household rows, then revalidate `/settings`, `/today`, `/assets`, and `/monthly-close` as needed.
- The UI submits plain forms so it works without custom client-side state.

## Testing

- Unit tests cover the new validation schemas and Korean label helpers.
- Existing smoke tests are updated to expect Korean login text.
- Full build/test verification must pass before delivery.
