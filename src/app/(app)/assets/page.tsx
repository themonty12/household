import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { getAssetsData } from "@/lib/repositories/finance";

const liabilityTypes = new Set(["card", "loan", "other_liability"]);

function accountTypeLabel(type: string) {
  return type.replaceAll("_", " ");
}

export default async function AssetsPage() {
  const { profile, supabase } = await requireUser();
  const { accounts } = await getAssetsData(supabase, profile.household_id);
  const includedAccounts = accounts.filter((account) => account.include_in_net_worth);
  const assets = includedAccounts
    .filter((account) => !liabilityTypes.has(account.type))
    .reduce((total, account) => total + Number(account.current_balance), 0);
  const liabilities = includedAccounts
    .filter((account) => liabilityTypes.has(account.type))
    .reduce((total, account) => total + Math.abs(Number(account.current_balance)), 0);
  const netWorth = assets - liabilities;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Assets</h1>
        <p className="text-sm leading-6 text-ink/70">
          Review active accounts and the household net worth position.
        </p>
      </div>

      <section aria-label="Assets summary" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Assets" value={formatWon(assets)} tone="positive" />
        <SummaryCard label="Liabilities" value={formatWon(liabilities)} tone="warning" />
        <SummaryCard label="Net worth" value={formatWon(netWorth)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">Accounts</h2>
          <span className="text-sm text-ink/60">{accounts.length} active</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
          {accounts.length === 0 ? (
            <p className="p-4 text-sm text-ink/65">No active accounts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {accounts.map((account) => {
                const balance = Number(account.current_balance);
                const isLiability = liabilityTypes.has(account.type);

                return (
                  <li
                    key={account.id}
                    className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {account.name}
                        </p>
                        {!account.include_in_net_worth ? (
                          <span className="rounded-md border border-line px-2 py-0.5 text-xs text-ink/60">
                            Excluded
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-normal text-ink/55">
                        {accountTypeLabel(account.type)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink sm:text-right">
                      {formatWon(isLiability ? Math.abs(balance) : balance)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
