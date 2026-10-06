"use client";

import { BookOpen, History, Home, LogOut, Mic, Moon, Sun, Trophy, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { PlanBadge } from "@/components/app/plan";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthActions, useHydrated, useSession } from "@/lib/auth/use-session";
import { useEntitlements } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Trang chủ", icon: Home, exact: true },
  { href: "/instruments", label: "Bài học", icon: BookOpen },
  { href: "/practice", label: "Luyện tập", icon: Mic },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/progress", label: "Tiến độ", icon: Trophy },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function QuotaChip() {
  const { data } = useEntitlements();
  if (!data) return null;
  const { limit, remaining } = data.aiQuota;
  if (limit === 0) {
    return (
      <Link href="/pricing" className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent sm:inline-flex">
        Mở khóa AI chấm điểm
      </Link>
    );
  }
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex tabular"
      title="Lượt AI chấm điểm còn lại trong tháng"
    >
      <Mic className="size-3.5" aria-hidden />
      {remaining}/{limit} lượt AI
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}

function UserMenu() {
  const session = useSession();
  const { logout } = useAuthActions();
  const router = useRouter();
  const { data } = useEntitlements();
  if (!session) return null;
  const initials = session.user.name.trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Tài khoản"
          />
        }
      >
        {initials || <User className="size-4" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          {data && <PlanBadge plan={data.plan} className="mt-2" />}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <User aria-hidden /> Tài khoản & gói
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <LogOut aria-hidden /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, session, pathname, router]);

  if (!hydrated || !session) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">♪</span>
            Folkify
          </Link>
          <nav aria-label="Điều hướng chính" className="hidden gap-1 md:flex">
            {NAV.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href, exact) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  "aria-[current=page]:bg-secondary aria-[current=page]:font-medium aria-[current=page]:text-secondary-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <QuotaChip />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-12">{children}</main>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground",
                    active && "font-medium text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
