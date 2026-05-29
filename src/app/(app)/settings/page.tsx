import { requireAdmin } from "@/lib/auth/require-user";

const setupActions = [
  "Create household accounts in Supabase.",
  "Create income and expense categories.",
  "Create monthly category budgets.",
  "Invite family members through Supabase Auth."
];

export default async function SettingsPage() {
  const { profile } = await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Settings</h1>
        <p className="text-sm leading-6 text-ink/70">
          Admin setup controls for the household workspace.
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold tracking-normal text-ink">Current admin</h2>
          <p className="mt-3 truncate text-sm font-semibold text-ink">
            {profile.display_name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-normal text-ink/55">
            {profile.role}
          </p>
        </div>

        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-normal text-ink">
              Next setup actions
            </h2>
            <span className="text-sm text-ink/60">{setupActions.length} items</span>
          </div>

          <ul className="mt-3 divide-y divide-line">
            {setupActions.map((action) => (
              <li key={action} className="py-3 text-sm leading-6 text-ink/75">
                {action}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
