import { signIn } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const hasInvalidCredentials = error === "invalid";

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-10 text-ink sm:px-6">
      <section className="w-full max-w-md rounded-md border border-line bg-white px-6 py-8 shadow-[0_18px_60px_rgba(23,33,31,0.10)] sm:px-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-normal text-leaf">
            Invite-only access
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-ink">Sign in</h1>
          <p className="text-sm leading-6 text-ink/70">
            Household Finance is available only to invited household members. Use the email
            address and password connected to your invitation.
          </p>
        </div>

        {hasInvalidCredentials ? (
          <p
            className="mt-6 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
            role="alert"
          >
            Email or password did not match.
          </p>
        ) : null}

        <form action={signIn} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full rounded-md border border-line bg-white px-3 text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-line bg-white px-3 text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="flex h-11 w-full items-center justify-center rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90 focus:outline-none focus:ring-2 focus:ring-leaf/30 focus:ring-offset-2"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
