"use client";

import Link from "next/link";
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
      <div className={cn("p-4 border-b flex items-center justify-between gap-2", collapsed && "p-3")}>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">King of Languages</p>
            <p className="text-base font-semibold truncate">Comms King</p>
          </div>
        )}
        <ModeToggle />
      </div>

      <nav className="flex-1 p-2 space-y-3 overflow-y-auto" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t space-y-0.5">
        <Link
          href="/settings"
          onClick={onItemClick}
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer",
            collapsed && "justify-center px-2",
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Configurações</span>}
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persistir estado colapsado
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
        className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-2.5"
        style={{ zIndex: "var(--z-nav)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
          className="h-8 w-8 cursor-pointer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">King of Languages</p>
          <p className="text-sm font-semibold truncate">Comms King</p>
        </div>
        <ModeToggle />
      </header>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 flex flex-col">
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
          "hidden lg:flex border-r bg-card flex-col h-screen sticky top-0 transition-[width] duration-200",
          collapsed ? "w-14" : "w-60",
        )}
        aria-label="Sidebar"
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  );
}
