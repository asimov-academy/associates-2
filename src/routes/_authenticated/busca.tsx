import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarPerfis, listarProcessos } from "@/lib/queries";
import { formatarCpf, type Processo } from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { ProcessoCard } from "@/components/ProcessoCard";
import { ProcessoDialog } from "@/components/ProcessoDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/busca")({
  head: () => ({
    meta: [
      { title: "Busca — Asimov Associates" },
      {
        name: "description",
        content:
          "Busca instantânea de processos por número, nome do cliente ou CPF, com filtro por advogado e situação.",
      },
      { property: "og:title", content: "Busca — Asimov Associates" },
      {
        property: "og:description",
        content: "Encontre processos por número, cliente ou CPF em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const [termo, setTermo] = useState("");
  const [advogado, setAdvogado] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [emEdicao, setEmEdicao] = useState<Processo | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const { data: processos = [] } = useQuery({
    queryKey: ["processos"],
    queryFn: listarProcessos,
  });
  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const advogados = perfis.filter((p) => p.papel === "advogado");

  const resultados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    const digitos = t.replace(/\D/g, "");
    return processos.filter((p) => {
      if (situacao === "ativos" && p.concluido) return false;
      if (situacao === "concluidos" && !p.concluido) return false;
      if (advogado !== "todos" && !p.advogados.some((a) => a.id === advogado)) return false;
      if (!t) return true;
      if (p.numero.toLowerCase().includes(t)) return true;
      if (p.acao.toLowerCase().includes(t)) return true;
      return p.clientes.some(
        (c) =>
          c.nome.toLowerCase().includes(t) ||
          (digitos.length >= 3 && c.cpf.includes(digitos)) ||
          formatarCpf(c.cpf).includes(t),
      );
    });
  }, [processos, termo, advogado, situacao]);

  async function excluir(processo: Processo) {
    if (!window.confirm(`Excluir o processo nº ${processo.numero}?`)) return;
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
      titulo="Busca de processos"
      descricao="Pesquise por número do processo, nome do cliente ou CPF."
    >
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="termo">Termo de busca</Label>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="termo"
              className="pl-9"
              maxLength={100}
              placeholder="Ex.: 0011, Maria Silva, 123.456.789-00"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Advogado responsável</Label>
          <Select value={advogado} onValueChange={setAdvogado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {advogados.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Situação</Label>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="ativos">Em andamento</SelectItem>
              <SelectItem value="concluidos">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {resultados.length} resultado(s) encontrado(s)
      </p>

      <div className="mt-3 space-y-4">
        {resultados.map((p) => (
          <ProcessoCard
            key={p.id}
            processo={p}
            podeExcluir={ehAdvogado}
            onEditar={(proc) => {
              setEmEdicao(proc);
              setDialogAberto(true);
            }}
            onExcluir={excluir}
          />
        ))}
      </div>

      <ProcessoDialog aberto={dialogAberto} processo={emEdicao} onOpenChange={setDialogAberto} />
    </AppShell>
  );
}
