"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Building2,
  Users,
  DoorOpen,
  Tag,
  CalendarCheck,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";

// ─── Navigation items ──────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Profil",
    href: "/admin/profile",
    icon: <Building2 className="size-4" />,
  },
  {
    label: "Member",
    href: "/admin/members",
    icon: <Users className="size-4" />,
  },
  {
    label: "Space",
    href: "/admin/spaces",
    icon: <DoorOpen className="size-4" />,
    disabled: true,
  },
  {
    label: "Diskon",
    href: "/admin/diskon",
    icon: <Tag className="size-4" />,
    disabled: true,
  },
  {
    label: "Reservasi",
    href: "/admin/reservasi",
    icon: <CalendarCheck className="size-4" />,
    disabled: true,
  },
  {
    label: "Laporan",
    href: "/admin/reports",
    icon: <BarChart3 className="size-4" />,
    disabled: true,
  },
];

// ─── Sidebar component (used both as desktop sidebar & mobile sheet) ───────

function SidebarContent({
  onNavClick,
}: {
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-indigo-950 text-white">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500">
          <Building2 className="size-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Smart Space Booking
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              onClick={(e) => {
                if (item.disabled) e.preventDefault();
                else onNavClick?.();
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive &&
                  "bg-indigo-600 text-white",
                !isActive &&
                  !item.disabled &&
                  "text-indigo-200 hover:bg-indigo-800/50 hover:text-white",
                item.disabled &&
                  "cursor-not-allowed text-indigo-400/40",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold uppercase">
            {user?.space_owner?.nama_pemilik?.charAt(0) ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.space_owner?.nama_coworking ?? user?.username ?? "Admin"}
            </p>
            <p className="truncate text-xs text-indigo-300">Admin Space</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-indigo-200 hover:bg-indigo-800/50 hover:text-white"
          onClick={() => logout()}
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

// ─── Main layout component ────────────────────────────────────────────────

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    );
  }

  // Derive page title from current path
  const currentNav = NAV_ITEMS.find((item) => item.href === pathname);
  const pageTitle = currentNav?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on <1024px */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar trigger */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-white px-4 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="size-4 text-indigo-600" />
          Smart Space Booking
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar (desktop) */}
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-sm lg:flex">
          <h1 className="text-sm font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.space_owner?.nama_coworking ?? user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => logout()}
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-zinc-50/50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}