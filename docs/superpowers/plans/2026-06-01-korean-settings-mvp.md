# Korean Settings MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the app to Korean and add admin-managed account, category, and monthly budget settings.

**Architecture:** Keep database values stable and add UI-facing label helpers. Add settings validation schemas, repository reads, and server actions that use the existing Supabase RLS plus `requireAdmin()` guard.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Supabase, Zod, Vitest, Playwright.

---

### Task 1: Labels And Validation

**Files:**
- Create: `src/lib/domain/labels.ts`
- Create: `src/lib/validation/settings.ts`
- Test: `tests/domain/labels.test.ts`
- Test: `tests/validation/settings.test.ts`

- [ ] Add Korean label maps for transaction, account, category, role, status, and common fallback labels.
- [ ] Add Zod schemas for account create/update, category create/update, and budget upsert.
- [ ] Verify invalid enum values and negative amounts fail.

### Task 2: Settings Data And Actions

**Files:**
- Modify: `src/lib/repositories/finance.ts`
- Create: `src/app/actions/settings.ts`

- [ ] Add `getSettingsData()` to load accounts, categories, current-month budgets, and household profiles.
- [ ] Add admin server actions for account create/update, category create/update, and budget upsert.
- [ ] Revalidate impacted app routes after writes.

### Task 3: Korean UI And Settings Page

**Files:**
- Modify: `src/components/app-shell.tsx`
- Modify: `src/components/forms/transaction-form.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(app)/today/page.tsx`
- Modify: `src/app/(app)/assets/page.tsx`
- Modify: `src/app/(app)/monthly-close/page.tsx`
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/domain/insights.ts`
- Modify: `tests/e2e/app-shell.spec.ts`

- [ ] Replace visible English UI copy with Korean.
- [ ] Render account/category/budget forms in settings.
- [ ] Update e2e smoke test to assert Korean login heading.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e` when the local environment allows it.
