# Household Finance App Design

## Summary

Build a responsive personal/family household finance web app for an invite-only, closed-access environment. The first version is a balanced MVP: daily transaction entry stays lightweight, monthly closing is quick, and asset management is present from the start without becoming a full investment platform.

The app starts with rule-based monthly insights instead of a live AI integration. The insight module must be isolated so a future external AI API or local/internal AI model can replace or enhance the rules without rewriting the finance data model.

## Goals

- Support both desktop and mobile layouts.
- Allow only approved family users to access the app.
- Make daily income/expense entry fast enough for repeated mobile use.
- Track accounts, assets, debts, budgets, and monthly net-worth snapshots.
- Generate monthly closing summaries with useful rule-based comments.
- Keep the architecture ready for later AI integration.

## Non-Goals for MVP

- Bank/card automatic sync.
- Open public sign-up.
- Enterprise permissions, audit workflows, or multi-household tenancy.
- Advanced investment analytics such as real-time prices or portfolio optimization.
- A production AI provider integration in the initial version.

## Product Shape

The MVP has four primary areas:

- Today: quick transaction entry, this-month budget status, and recent transactions.
- Monthly Close: income, expense, budget variance, category trends, and generated comments.
- Assets: account balances, cash, investments, debts, and monthly net-worth changes.
- Settings: family users, categories, accounts, budgets, and access controls.

Mobile prioritizes quick input and recent status. Desktop prioritizes monthly review, trends, and asset overview.

## Users and Access

The app is for a personal/family setting. An administrator invites family members and controls whether each member is active. Public registration is not part of the MVP.

Initial roles:

- Admin: manage users, settings, accounts, categories, budgets, and all transactions.
- Member: create and edit own transactions and view household summaries.

The implementation should keep role checks explicit around settings and user management. If the app later needs stricter privacy, transaction ownership and account visibility can be expanded without changing the core data model.

## Core Data Model

User:

- id
- name
- email or login id
- role: admin or member
- status: invited, active, disabled
- createdAt

Account:

- id
- name
- type: cash, bank, card, investment, loan, other_asset, other_liability
- ownerUserId, optional
- includeInNetWorth
- currentBalance
- status: active or archived

Category:

- id
- name
- type: income, expense, transfer
- parentCategoryId, optional
- sortOrder
- status: active or archived

Transaction:

- id
- date
- type: income, expense, transfer, adjustment
- amount
- accountId
- toAccountId, only for transfers
- categoryId
- userId
- memo
- status: posted, voided
- createdAt
- updatedAt

Budget:

- id
- month
- categoryId
- amount
- createdByUserId

MonthlySnapshot:

- id
- month
- totalAssets
- totalLiabilities
- netWorth
- accountBalances
- generatedAt

MonthlyClose:

- id
- month
- incomeTotal
- expenseTotal
- transferTotal
- budgetVariance
- savingsRate
- fixedCostRatio
- netWorthChange
- insightItems
- generatedAt

## Monthly Closing

Monthly closing is recalculable. It should not be treated as an immutable accounting lock in the MVP. When transactions, budgets, or account balances are edited, the user can regenerate the monthly close.

The close process:

1. Select month.
2. Aggregate income, expense, transfers, and category totals.
3. Compare expense categories against budgets.
4. Compare totals against the previous month.
5. Load the closest monthly asset snapshot.
6. Generate rule-based insight items.
7. Save or refresh the MonthlyClose result.

## Rule-Based Insight Engine

The insight module receives normalized monthly metrics and returns a list of insight items. Each item includes:

- severity: info, positive, warning
- title
- message
- metric references
- suggested action, optional

Initial rules:

- Budget overrun: category spending exceeds its monthly budget.
- Spending increase: category spending rises meaningfully from the previous month.
- Savings rate: income minus expenses as a percentage of income.
- Fixed cost pressure: recurring or fixed categories take a high share of income.
- Net-worth movement: assets minus liabilities changed from the previous snapshot.
- Missing data: budgets or snapshots are missing, so the close is less complete.

The module boundary should make future AI straightforward:

- Rules produce structured facts and baseline comments.
- A later AI adapter can turn those facts into natural-language guidance.
- Sensitive raw transaction details should not be sent to an AI provider by default.

## UI Design

Navigation:

- Desktop: left or top navigation with Today, Monthly Close, Assets, Settings.
- Mobile: bottom navigation with Today, Close, Assets, Settings.

Today screen:

- Quick transaction form: amount, type, category, account, date, memo.
- Recent transaction list.
- Current month summary: spent, remaining budget, income, expense.

Monthly Close screen:

- Month selector.
- Summary cards: income, expense, budget variance, net-worth change.
- Category spending breakdown.
- Month-over-month comparison.
- Insight panel with generated comments.
- Regenerate close action.

Assets screen:

- Account list grouped by asset and liability.
- Net-worth summary.
- Monthly snapshot creation or update.
- Balance history summary.

Settings screen:

- Family users and invitations.
- Accounts.
- Categories.
- Budgets.

## Error Handling and Validation

- Amount must be positive; transaction type determines direction.
- Transfers require both source and destination accounts.
- Archived accounts and categories remain visible on old records but cannot be selected for new records by default.
- Voiding is preferred over hard deletion for posted transactions.
- Monthly close regeneration should show when source data has changed.
- Missing budget or snapshot data should produce an insight instead of blocking the close.

## Security Notes

- No public sign-up in MVP.
- Invite or admin-created accounts only.
- Passwords or login secrets must be stored using standard secure hashing.
- Session cookies should be HTTP-only and same-site.
- Admin-only routes must verify role server-side.
- Finance data exports and future AI adapters should require explicit admin action.

## Architecture

Recommended modules:

- Auth: login, invited users, sessions, role checks.
- Transactions: transaction CRUD, validation, filtering.
- Assets: accounts, balances, snapshots, net-worth metrics.
- Budgets: monthly category budgets.
- Monthly Close: aggregation and saved close results.
- Insights: rule-based comments now, AI-ready adapter boundary later.
- UI: responsive app shell and feature screens.

Data flow:

1. Users create transactions and update asset balances.
2. Budgets define expected monthly category spend.
3. Monthly Close aggregates the month.
4. Insights evaluates the aggregated result.
5. UI presents summaries, trends, and comments.

## Testing Strategy

Unit tests:

- Transaction validation.
- Transfer validation.
- Budget variance calculations.
- Monthly aggregation.
- Insight rule outputs.
- Net-worth calculations.

Integration tests:

- User can create a transaction and see it in monthly totals.
- User can create budgets and regenerate a monthly close.
- Missing snapshot still allows a close with a warning insight.
- Admin-only settings routes reject member access.

Responsive verification:

- Mobile width for Today and quick entry.
- Desktop width for Monthly Close and Assets.
- Form controls remain usable without text overlap.

## Implementation Notes

The repository is currently empty except for Git metadata. Implementation can start from a modern full-stack web app scaffold. Favor a stack with server-rendered or API-backed authenticated routes, a relational database, and a responsive component system.

The first implementation plan should create the app shell, auth boundary, database schema, transaction flow, monthly close calculation, and rule-based insights in that order.
