import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireUser();

  return <AppShell role={profile.role}>{children}</AppShell>;
}
