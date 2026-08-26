import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Scale,
  Users,
  FolderOpen,
  Search,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { usePerfilAtual } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/processos", label: "Processos", icon: FolderOpen },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/advogados", label: "Advogados", icon: Scale },
  { to: "/busca", label: "Busca", icon: Search },
];

export function AppShell({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const { data: perfil } = usePerfilAtual();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-6 py-6">
          <p className="font-serif text-lg leading-tight font-semibold">Asimov</p>
          <p className="text-xs tracking-[0.18em] text-sidebar-foreground/60 uppercase">
            Associates
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">{perfil?.nome ?? "—"}</p>
          <p className="mb-3 text-xs text-sidebar-foreground/60 capitalize">
            {perfil?.papel === "secretaria" ? "Secretária" : "Advogado"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={sair}
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-start justify-between gap-6 border-b border-border bg-card px-8 py-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold">{titulo}</h1>
            {descricao ? (
              <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">{acoes}</div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
