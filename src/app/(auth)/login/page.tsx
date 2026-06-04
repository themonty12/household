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
    <main className="grid min-h-screen bg-mist text-ink lg:grid-cols-[minmax(22rem,0.8fr)_minmax(28rem,1.2fr)]">
      <section className="hidden bg-slate p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-lg font-bold">우리집 가계부</div>
        <div className="max-w-md space-y-3">
          <p className="text-sm font-bold text-leaf">가족을 위한 재정 기록</p>
          <h1 className="text-4xl font-bold leading-tight">함께 기록하고,<br />한눈에 결산하세요.</h1>
          <p className="text-sm leading-6 text-white/55">허용된 가족 구성원만 접근할 수 있는 안전한 가계부입니다.</p>
        </div>
        <p className="text-xs text-white/35">Private household finance</p>
      </section>
      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
      <section className="panel w-full max-w-md px-6 py-8 sm:px-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-normal text-leaf">
            초대된 사용자만 접근 가능
          </p>
          <h1 className="text-3xl font-bold text-ink">로그인</h1>
          <p className="text-sm leading-6 text-ink/70">
            우리집 가계부는 허용된 가족 구성원만 사용할 수 있습니다. 등록된 이메일과
            비밀번호로 로그인해 주세요.
          </p>
        </div>

        {hasInvalidCredentials ? (
          <p
            className="mt-6 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
            role="alert"
          >
            이메일 또는 비밀번호가 올바르지 않습니다.
          </p>
        ) : null}

        <form action={signIn} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="email">
              이메일
            </label>
            <input
              autoComplete="email"
              className="field-control w-full"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="password">
              비밀번호
            </label>
            <input
              autoComplete="current-password"
              className="field-control w-full"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="button-primary w-full"
            type="submit"
          >
            로그인
          </button>
        </form>
      </section>
      </div>
    </main>
  );
}
