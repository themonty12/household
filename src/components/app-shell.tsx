"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Landmark, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { AppRole } from "@/lib/auth/require-user";

type NavItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navigation: NavItem[] = [
  { label: "오늘", href: "/today", icon: Home },
  { label: "월 결산", href: "/monthly-close", icon: BarChart3 },
  { label: "자산", href: "/assets", icon: Landmark },
  { label: "설정", href: "/settings", icon: Settings, adminOnly: true }
];

type AppShellProps = {
  children: React.ReactNode;
  role: AppRole;
};

export function AppShell({ children, role }: AppShellProps) {
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 md:flex md:flex-col">
        <Link href="/today" className="mb-8 flex flex-col gap-1 px-2">
          <span className="text-lg font-semibold tracking-normal">우리집 가계부</span>
          <span className="text-sm text-ink/60">가족 자산과 지출 관리</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-1 flex-col gap-1">
          {visibleNavigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      <main className="min-h-screen px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:ml-64 md:px-8 md:pb-8 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <nav
        aria-label="주요 메뉴"
        className={clsx(
          "fixed inset-x-0 bottom-0 z-20 grid h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-line bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(23,33,31,0.08)] backdrop-blur md:hidden",
          role === "admin" ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {visibleNavigation.map((item) => (
          <NavLink key={item.href} item={item} mobile />
        ))}
      </nav>
    </div>
  );
}

function NavLink({ item, mobile = false }: { item: NavItem; mobile?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex min-w-0 items-center text-sm font-medium transition-colors",
        active ? "bg-leaf text-white" : "text-ink/70 hover:bg-line/60 hover:text-ink",
        mobile
          ? "h-full flex-col justify-center gap-1 rounded-md px-1"
          : "h-11 gap-3 rounded-md px-3"
      )}
    >
      <Icon aria-hidden="true" className={clsx("shrink-0", mobile ? "h-5 w-5" : "h-4 w-4")} />
      <span className={clsx("truncate", mobile ? "text-xs leading-none" : "text-sm")}>
        {item.label}
      </span>
    </Link>
  );
}
