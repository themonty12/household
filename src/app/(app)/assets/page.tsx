import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { accountTypeLabel } from "@/lib/domain/labels";
import { getAssetsData } from "@/lib/repositories/finance";

const liabilityTypes = new Set(["card", "loan", "other_liability"]);

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
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="page-title">자산</h1>
        <p className="text-sm leading-6 text-ink/55">
          사용 중인 계좌와 우리집 순자산 상태를 확인합니다.
        </p>
      </div>

      <section aria-label="자산 요약" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="자산" value={formatWon(assets)} tone="positive" />
        <SummaryCard label="부채" value={formatWon(liabilities)} tone="warning" />
        <SummaryCard label="순자산" value={formatWon(netWorth)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">계좌</h2>
          <span className="text-sm font-semibold text-ink/45">{accounts.length}개 사용 중</span>
        </div>

        <div className="panel overflow-hidden">
          {accounts.length === 0 ? (
            <p className="p-4 text-sm text-ink/65">아직 사용 중인 계좌가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line">
              {accounts.map((account) => {
                const balance = Number(account.current_balance);
                const isLiability = liabilityTypes.has(account.type);

                return (
                  <li
                    key={account.id}
                    className="grid gap-2 p-4 transition hover:bg-paper/70 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {account.name}
                        </p>
                        {!account.include_in_net_worth ? (
                          <span className="rounded-md bg-paper px-2 py-1 text-xs font-semibold text-ink/50">
                            순자산 제외
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
