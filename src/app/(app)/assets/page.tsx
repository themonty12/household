import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  TrendingDown,
  TrendingUp,
  WalletCards
} from "lucide-react";
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
  const assetAccounts = accounts.filter((account) => !liabilityTypes.has(account.type));
  const liabilityAccounts = accounts.filter((account) => liabilityTypes.has(account.type));
  const assetRatio = assets + liabilities === 0 ? 0 : Math.round((assets / (assets + liabilities)) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="hidden text-xs font-semibold text-ink/40 md:block">Accounts</p>
        <h1 className="page-title">자산 현황</h1>
        <p className="text-sm leading-6 text-ink/55">
          사용 중인 계좌와 우리집 순자산 상태를 확인합니다.
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <div className="rounded-lg bg-slate p-5 text-white shadow-panel sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/55">우리집 순자산</p>
              <p className="mt-2 text-3xl font-bold sm:text-4xl">{formatWon(netWorth)}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10">
              <Landmark aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-xs text-white/45">총 자산</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">{formatWon(assets)}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">총 부채</p>
              <p className="mt-1 text-sm font-bold text-red-300">{formatWon(liabilities)}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink/45">자산 구성</p>
              <p className="mt-1 text-xl font-bold text-ink">자산 {assetRatio}%</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-leaf/10 text-leaf">
              <TrendingUp aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-coral/20">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${assetRatio}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs font-semibold">
            <span className="text-leaf">자산</span>
            <span className="text-coral">부채</span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <AccountGroup title="자산 계좌" accounts={assetAccounts} liability={false} />
        <AccountGroup title="부채 계좌" accounts={liabilityAccounts} liability />
      </div>
    </div>
  );
}

type AssetAccount = Awaited<ReturnType<typeof getAssetsData>>["accounts"][number];

function accountIcon(type: string) {
  if (type === "card") return CreditCard;
  if (type === "cash") return Banknote;
  if (type === "bank" || type === "loan") return Building2;
  return WalletCards;
}

function AccountGroup({
  title,
  accounts,
  liability
}: {
  title: string;
  accounts: AssetAccount[];
  liability: boolean;
}) {
  const ToneIcon = liability ? TrendingDown : TrendingUp;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ToneIcon aria-hidden="true" className={`h-4 w-4 ${liability ? "text-coral" : "text-leaf"}`} />
          <h2 className="section-title">{title}</h2>
        </div>
        <span className="text-xs font-semibold text-ink/40">{accounts.length}개</span>
      </div>
      <div className="panel overflow-hidden">
        {accounts.length === 0 ? (
          <p className="p-5 text-sm text-ink/55">표시할 계좌가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {accounts.map((account) => {
              const Icon = accountIcon(account.type);
              return (
                <li key={account.id} className="flex items-center gap-3 px-4 py-4 transition hover:bg-paper/70">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${liability ? "bg-coral/10 text-coral" : "bg-leaf/10 text-leaf"}`}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{account.name}</p>
                      {!account.include_in_net_worth ? (
                        <span className="shrink-0 rounded bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink/40">제외</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-ink/40">{accountTypeLabel(account.type)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${liability ? "text-coral" : "text-ink"}`}>
                    {formatWon(Math.abs(Number(account.current_balance)))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
