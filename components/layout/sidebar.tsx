"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Sparkles,
  Film,
  Wand2,
  CalendarDays,
  Users,
  BarChart3,
  LineChart,
  Flame,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Estratégia",
    items: [
      { href: "/briefs", label: "Briefs", icon: FileText },
      { href: "/ideas", label: "Big Ideas", icon: Lightbulb },
      { href: "/zeitgeist", label: "Zeitgeist", icon: Sparkles },
      { href: "/trends", label: "Trends do dia", icon: Flame },
    ],
  },
  {
    label: "Criação",
    items: [
      { href: "/concepts", label: "Conceitos", icon: Film },
      { href: "/scripts", label: "Roteiros", icon: Wand2 },
      { href: "/calendar", label: "Calendário", icon: CalendarDays },
      { href: "/community", label: "Comunidade", icon: Users },
    ],
  },
  {
    label: "Dados",
    items: [
      { href: "/analytics", label: "Analytics IG", icon: BarChart3 },
      { href: "/ga4", label: "Google Analytics", icon: LineChart },
      { href: "/sales", label: "Vendas", icon: DollarSign },
    ],
  },
];

function SidebarContent({
  collapsed,
  onItemClick,
}: {
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Brand */}
      <div className={cn(
        "px-4 py-5 flex items-center gap-3 border-b border-sidebar-border",
        collapsed && "px-3 justify-center",
      )}>
        <div className="relative h-9 w-9 flex-shrink-0">
          <Image
            src="/brand/lion-light.png"
            alt="King of Languages"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
              King of Languages
            </p>
            <p className="font-display text-base font-semibold text-sidebar-foreground truncate -mt-0.5">
              Comms King
            </p>
          </div>
        )}
        {!collapsed && <ModeToggle />}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45 font-semibold">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={onItemClick}
                    onMouseEnter={() => router.prefetch(item.href)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                      "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_4px_16px_-4px_oklch(0.7_0.18_28_/_50%)]"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-transform", !active && "group-hover:scale-110")} aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        <Link
          href="/settings"
          onClick={onItemClick}
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer",
            collapsed && "justify-center px-2",
          )}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Configurações</span>}
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  }

  return (
    <>
      {/* Mobile header */}
      <header
        className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b bg-sidebar text-sidebar-foreground px-4 py-3"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
          className="h-8 w-8 cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="relative h-7 w-7 flex-shrink-0">
          <Image src="/brand/lion-light.png" alt="King" fill sizes="28px" className="object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/60">King of Languages</p>
          <p className="font-display text-sm font-semibold truncate -mt-0.5">Comms King</p>
        </div>
        <ModeToggle />
      </header>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegue entre as áreas do app Comms King
          </SheetDescription>
          <SidebarContent collapsed={false} onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex bg-sidebar text-sidebar-foreground flex-col h-screen sticky top-0 transition-[width] duration-200 border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64",
        )}
        aria-label="Sidebar"
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="absolute -right-3 top-24 h-6 w-6 rounded-full border bg-card text-foreground/70 flex items-center justify-center hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none shadow-md"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  );
}
