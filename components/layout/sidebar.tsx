"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/briefs", label: "Briefs", icon: FileText },
  { href: "/ideas", label: "Big Ideas", icon: Lightbulb },
  { href: "/zeitgeist", label: "Zeitgeist", icon: Sparkles },
  { href: "/trends", label: "Trends do dia", icon: Flame },
  { href: "/concepts", label: "Conceitos", icon: Film },
  { href: "/scripts", label: "Roteiros", icon: Wand2 },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/community", label: "Comunidade", icon: Users },
  { href: "/analytics", label: "Analytics IG", icon: BarChart3 },
  { href: "/ga4", label: "Google Analytics", icon: LineChart },
  { href: "/sales", label: "Vendas", icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">King of Languages</p>
        <p className="text-lg font-semibold">Comms King</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
