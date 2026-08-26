import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarProcessos } from "@/lib/queries";
import { prazoUrgente, type Processo } from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { ProcessoCard } from "@/components/ProcessoCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Asimov Associates" },
      {
        name: "description",
        content:
          "Panorama do escritório: processos ativos, prazos vencendo em 7 dias e a lista de processos ordenada pelo prazo mais próximo.",
      },
      { property: "og:title", content: "Painel — Asimov Associates" },
      {
        property: "og:description",
        content: "Processos ativos, prazos urgentes e status de cada processo do escritório.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const { data: processos = [], isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: listarProcessos,
  });

  const ordenados = useMemo(() => ordenarPorPrazo(processos), [processos]);

  const metricas = useMemo(() => {
    const ativos = processos.filter((p) => !p.concluido);
    const urgentes = processos.filter(prazoUrgente);
    const agora = new Date();
    const concluidosMes = processos.filter(
      (p) =>
        p.concluido &&
        p.data_final &&
        new Date(`${p.data_final}T00:00:00`).getMonth() === agora.getMonth() &&
        new Date(`${p.data_final}T00:00:00`).getFullYear() === agora.getFullYear(),
    );
    const porAdvogado = new Map<string, number>();
    for (const p of processos) {
      if (p.concluido) continue;
      for (const a of p.advogados) porAdvogado.set(a.nome, (porAdvogado.get(a.nome) ?? 0) + 1);
    }
    return { ativos: ativos.length, urgentes: urgentes.length, concluidosMes: concluidosMes.length, porAdvogado };
  }, [processos]);

  async function excluir(processo: Processo) {
    if (!window.confirm(`Excluir o processo nº ${processo.numero}? Esta ação é definitiva.`))
      return;
    const { error } = await supabase.from("processos").delete().eq("id", processo.id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["processos"] });
    toast.success("Processo excluído");
  }

  return (
    <AppShell
      titulo="Painel do escritório"
      descricao="Processos ordenados pelo prazo mais próximo. Prazos em menos de 7 dias aparecem destacados."
      acoes={
        ehAdvogado ? (
          <Button asChild>
            <Link to="/processos/novo">
              <Plus className="mr-2 h-4 w-4" /> Novo processo
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <CardNumero rotulo="Processos ativos" valor={metricas.ativos} />
        <CardNumero rotulo="Prazos em até 7 dias" valor={metricas.urgentes} destaque />
        <CardNumero rotulo="Concluídos no mês" valor={metricas.concluidosMes} />
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Ativos por advogado
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {metricas.porAdvogado.size === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : (
              [...metricas.porAdvogado.entries()].map(([nome, qtd]) => (
                <li key={nome} className="flex justify-between gap-2">
                  <span className="truncate">{nome}</span>
                  <span className="font-medium">{qtd}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando processos…</p>
        ) : ordenados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum processo cadastrado ainda. Comece cadastrando o primeiro.
          </p>
        ) : (
          ordenados.map((p) => (
            <ProcessoCard
              key={p.id}
              processo={p}
              podeExcluir={ehAdvogado}
              onExcluir={excluir}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

export function ordenarPorPrazo(processos: Processo[]): Processo[] {
  return [...processos].sort((a, b) => {
    if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
    const pa = a.proximo_prazo ?? "9999-12-31";
    const pb = b.proximo_prazo ?? "9999-12-31";
    return pa.localeCompare(pb);
  });
}

function CardNumero({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        destaque && valor > 0
          ? "rounded-lg border border-primary/50 bg-accent p-4"
          : "rounded-lg border border-border bg-card p-4"
      }
    >
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{rotulo}</p>
      <p
        className={
          destaque && valor > 0
            ? "mt-2 font-serif text-3xl font-semibold text-primary"
            : "mt-2 font-serif text-3xl font-semibold"
        }
      >
        {valor}
      </p>
    </div>
  );
}
