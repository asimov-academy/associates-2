import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarProcessos } from "@/lib/queries";
import { FASES, TIPOS_PROCESSO, type Processo } from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { ProcessoCard } from "@/components/ProcessoCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/processos/")({
  head: () => ({
    meta: [
      { title: "Processos — Asimov Associates" },
      {
        name: "description",
        content:
          "Todos os processos do escritório com filtros por situação, tipo e fase processual.",
      },
      { property: "og:title", content: "Processos — Asimov Associates" },
      {
        property: "og:description",
        content: "Todos os processos do escritório com filtros por situação, tipo e fase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProcessosPage,
});

function ProcessosPage() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const [situacao, setSituacao] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [fase, setFase] = useState("todas");

  const { data: processos = [], isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: listarProcessos,
  });

  const filtrados = useMemo(
    () =>
      processos.filter((p) => {
        if (situacao === "ativos" && p.concluido) return false;
        if (situacao === "concluidos" && !p.concluido) return false;
        if (tipo !== "todos" && p.tipo !== tipo) return false;
        if (fase !== "todas" && p.fase !== fase) return false;
        return true;
      }),
    [processos, situacao, tipo, fase],
  );

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
      titulo="Processos"
      descricao="Histórico completo de todos os processos do escritório."
      acoes={
        <Button asChild>
          <Link to="/processos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo processo
          </Link>
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Filtro
          valor={situacao}
          onChange={setSituacao}
          opcoes={[
            { valor: "todos", rotulo: "Todas as situações" },
            { valor: "ativos", rotulo: "Em andamento" },
            { valor: "concluidos", rotulo: "Concluídos" },
          ]}
        />
        <Filtro
          valor={tipo}
          onChange={setTipo}
          opcoes={[
            { valor: "todos", rotulo: "Todos os tipos" },
            ...TIPOS_PROCESSO.map((t) => ({ valor: t, rotulo: t })),
          ]}
        />
        <Filtro
          valor={fase}
          onChange={setFase}
          opcoes={[
            { valor: "todas", rotulo: "Todas as fases" },
            ...FASES.map((f) => ({ valor: f, rotulo: f })),
          ]}
        />
        <p className="ml-auto self-center text-sm text-muted-foreground">
          {filtrados.length} processo(s)
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando processos…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum processo encontrado.</p>
        ) : (
          filtrados.map((p) => (
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

function Filtro({
  valor,
  onChange,
  opcoes,
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
