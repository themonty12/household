"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Home, Landmark, ListChecks, Search, Settings, WalletCards } from "lucide-react";
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
  { label: "내역", href: "/transactions", icon: ListChecks },
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
  const pathname = usePathname();
  const currentPage = visibleNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white px-4 py-5 md:flex md:flex-col">
        <Link href="/today" className="mb-8 flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate text-white">
            <WalletCards aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base font-bold text-ink">우리집 가계부</span>
            <span className="truncate text-xs text-ink/40">가족 자산과 지출 관리</span>
          </span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-1 flex-col gap-1">
          {visibleNavigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      <header className="fixed inset-x-0 top-0 z-20 hidden h-16 items-center border-b border-line bg-white/95 px-10 backdrop-blur md:left-64 md:flex">
        <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-md bg-paper px-3 text-ink/40">
          <Search aria-hidden="true" className="h-4 w-4" />
          <span className="text-sm">거래와 계좌를 검색하세요</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button aria-label="알림" className="flex h-10 w-10 items-center justify-center rounded-md text-ink/55 hover:bg-paper">
            <Bell aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate text-xs font-bold text-white">우</span>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
        <Link href="/today" className="flex items-center gap-2 text-sm font-bold text-ink">
          <WalletCards aria-hidden="true" className="h-4 w-4 text-leaf" />
          {currentPage?.label ?? "우리집 가계부"}
        </Link>
        <button aria-label="알림" className="flex h-10 w-10 items-center justify-center rounded-md text-ink/55">
          <Bell aria-hidden="true" className="h-4 w-4" />
        </button>
      </header>

      <main className="min-h-screen px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:ml-64 md:px-10 md:pb-10 md:pt-24">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>

      <nav
        aria-label="주요 메뉴"
        className={clsx(
          "fixed inset-x-0 bottom-0 z-30 grid h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-line bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(9,20,38,0.08)] backdrop-blur md:hidden",
          role === "admin" ? "grid-cols-5" : "grid-cols-4"
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
        "flex min-w-0 items-center text-sm font-semibold transition-colors",
        active
          ? mobile
            ? "text-info"
            : "bg-blue-100 text-info"
          : "text-ink/50 hover:bg-paper hover:text-ink",
        mobile
          ? "h-full min-h-12 flex-col justify-center gap-1 rounded-md px-1"
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
