import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();

  return <AppShell>{children}</AppShell>;
}
