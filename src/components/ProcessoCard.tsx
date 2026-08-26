import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  diasAte,
  formatarData,
  prazoUrgente,
  resultadoProcesso,
  type Processo,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

function textoPrazo(processo: Processo) {
  const dias = diasAte(processo.proximo_prazo);
  if (dias === null) return "Sem prazo definido";
  if (dias < 0) return `Prazo vencido há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return "Prazo vence hoje";
  return `Prazo em ${dias} dia(s) — ${formatarData(processo.proximo_prazo)}`;
}

export function ProcessoCard({
  processo,
  podeExcluir,
  onExcluir,
}: {
  processo: Processo;
  podeExcluir: boolean;
  onExcluir: (p: Processo) => void;
}) {
  const urgente = prazoUrgente(processo);
  const resultado = resultadoProcesso(processo);

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm",
        urgente ? "border-primary/50 bg-accent/50 shadow-[inset_3px_0_0_0] shadow-primary" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/processos/$processoId"
            params={{ processoId: processo.id }}
            className="font-serif text-lg font-semibold hover:text-primary hover:underline"
          >
            Processo nº {processo.numero}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {processo.acao} · {processo.tipo} · {processo.instancia}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {podeExcluir ? (
            <Button variant="ghost" size="icon" aria-label="Editar processo" asChild>
              <Link to="/processos/editar/$processoId" params={{ processoId: processo.id }}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edição permitida apenas a advogados"
              title="Somente advogados podem editar processos"
              className="opacity-50"
              onClick={() =>
                toast.error("Edição não permitida", {
                  description:
                    "A secretaria tem acesso somente para consulta. Peça a um advogado do escritório.",
                })
              }
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              podeExcluir ? "Excluir processo" : "Exclusão permitida apenas a advogados"
            }
            title={
              podeExcluir
                ? "Excluir processo"
                : "Somente advogados podem excluir processos"
            }
            className={cn(!podeExcluir && "opacity-50")}
            onClick={() =>
              podeExcluir
                ? onExcluir(processo)
                : toast.error("Exclusão não permitida", {
                    description:
                      "Somente advogados podem excluir processos. Peça a um advogado do escritório.",
                  })
            }
          >
            {podeExcluir ? (
              <Trash2 className="h-4 w-4 text-destructive" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={processo.concluido ? "secondary" : "default"}>
          {processo.concluido ? "Concluído" : "Em andamento"}
        </Badge>
        <Badge variant="outline">Fase: {processo.fase}</Badge>
        <Badge variant="outline">{processo.vara}</Badge>
        {processo.concluido ? (
          <Badge variant={processo.vencido ? "destructive" : "outline"}>{resultado}</Badge>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Cliente(s)</dt>
          <dd className="truncate">
            {processo.clientes.map((c) => c.nome).join(", ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Advogado(s)</dt>
          <dd className="truncate">
            {processo.advogados.map((a) => a.nome).join(", ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Data inicial</dt>
          <dd>{formatarData(processo.data_inicial)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Data final</dt>
          <dd>{formatarData(processo.data_final)}</dd>
        </div>
      </dl>

      {processo.descricao ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{processo.descricao}</p>
      ) : null}

      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          urgente
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-muted text-muted-foreground",
        )}
      >
        {urgente ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CalendarClock className="h-4 w-4" />
        )}
        {processo.concluido ? "Processo concluído" : textoPrazo(processo)}
      </div>
    </article>
  );
}
