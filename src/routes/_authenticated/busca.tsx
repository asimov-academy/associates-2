import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarPerfis, listarProcessos } from "@/lib/queries";
import {
  diasAte,
  formatarCpf,
  mascararCpf,
  normalizarCpf,
  type Processo,
} from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { ProcessoCard } from "@/components/ProcessoCard";
import { Button } from "@/components/ui/button";
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
          "Busca instantânea de processos por número, nome do cliente ou CPF, com filtros de status e prazo e ordenação.",
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

type Campo = "tudo" | "numero" | "cliente" | "cpf";

/** Detecta se o termo digitado se parece com um CPF (só dígitos e pontuação). */
function pareceCpf(termo: string): boolean {
  return /\d/.test(termo) && /^[\d.\-\s]+$/.test(termo);
}

export function BuscaPage() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const [termo, setTermo] = useState("");
  const [campo, setCampo] = useState<Campo>("tudo");
  const [advogado, setAdvogado] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [prazo, setPrazo] = useState("todos");
  const [ordem, setOrdem] = useState("prazo");

  const { data: processos = [] } = useQuery({
    queryKey: ["processos"],
    queryFn: listarProcessos,
  });
  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const advogados = perfis.filter((p) => p.papel === "advogado");

  function aoDigitar(valor: string) {
    if (campo === "cpf") return setTermo(mascararCpf(valor));
    setTermo(pareceCpf(valor) ? mascararCpf(valor) : valor);
  }

  const resultados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    const digitos = normalizarCpf(termo);
    const filtrados = processos.filter((p) => {
      if (status === "andamento" && p.concluido) return false;
      if (status === "concluidos" && !p.concluido) return false;
      if (status === "ganhos" && !(p.concluido && !p.vencido)) return false;
      if (status === "perdidos" && !(p.concluido && p.vencido)) return false;

      if (prazo !== "todos") {
        const dias = diasAte(p.proximo_prazo);
        if (prazo === "sem" && p.proximo_prazo) return false;
        if (prazo === "vencidos" && !(dias !== null && dias < 0 && !p.concluido)) return false;
        if (prazo === "7" && !(dias !== null && dias >= 0 && dias <= 7 && !p.concluido))
          return false;
        if (prazo === "30" && !(dias !== null && dias >= 0 && dias <= 30 && !p.concluido))
          return false;
      }

      if (advogado !== "todos" && !p.advogados.some((a) => a.id === advogado)) return false;
      if (!t) return true;

      const porNumero = p.numero.toLowerCase().includes(t) || p.numero.includes(digitos);
      const porCliente = p.clientes.some((c) => c.nome.toLowerCase().includes(t));
      const porCpf =
        digitos.length >= 3 &&
        p.clientes.some((c) => normalizarCpf(c.cpf).includes(digitos));

      if (campo === "numero") return porNumero;
      if (campo === "cliente") return porCliente;
      if (campo === "cpf") return porCpf;
      return porNumero || porCliente || porCpf || p.acao.toLowerCase().includes(t);
    });

    const ordenados = [...filtrados];
    ordenados.sort((a, b) => {
      if (ordem === "numero") return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
      if (ordem === "recentes") return b.data_inicial.localeCompare(a.data_inicial);
      if (ordem === "prazo-distante")
        return (b.proximo_prazo ?? "0000-01-01").localeCompare(a.proximo_prazo ?? "0000-01-01");
      if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
      return (a.proximo_prazo ?? "9999-12-31").localeCompare(b.proximo_prazo ?? "9999-12-31");
    });
    return ordenados;
  }, [processos, termo, campo, advogado, status, prazo, ordem]);

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

  function limpar() {
    setTermo("");
    setCampo("tudo");
    setAdvogado("todos");
    setStatus("todos");
    setPrazo("todos");
    setOrdem("prazo");
  }

  return (
    <AppShell
      titulo="Busca de processos"
      descricao="Pesquise por número do processo, nome do cliente ou CPF (com ou sem pontuação)."
    >
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="termo">Termo de busca</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="termo"
                className="pl-9"
                maxLength={100}
                inputMode={campo === "cpf" ? "numeric" : "text"}
                placeholder="Ex.: 0011, Maria Silva, 123.456.789-00"
                value={termo}
                onChange={(e) => aoDigitar(e.target.value)}
              />
            </div>
            {pareceCpf(termo) || campo === "cpf" ? (
              <p className="text-xs text-muted-foreground">
                CPF normalizado: {formatarCpf(normalizarCpf(termo)) || "—"}
              </p>
            ) : null}
          </div>
          <Campo label="Buscar em">
            <Select
              value={campo}
              onValueChange={(v) => {
                setCampo(v as Campo);
                if (v === "cpf") setTermo(mascararCpf(termo));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tudo">Todos os campos</SelectItem>
                <SelectItem value="numero">Número do processo</SelectItem>
                <SelectItem value="cliente">Nome do cliente</SelectItem>
                <SelectItem value="cpf">CPF do cliente</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Campo label="Advogado responsável">
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
          </Campo>
          <Campo label="Status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="andamento">Em andamento</SelectItem>
                <SelectItem value="concluidos">Concluídos</SelectItem>
                <SelectItem value="ganhos">Concluídos — ganhos</SelectItem>
                <SelectItem value="perdidos">Concluídos — perdidos</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Prazo">
            <Select value={prazo} onValueChange={setPrazo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer prazo</SelectItem>
                <SelectItem value="vencidos">Vencidos</SelectItem>
                <SelectItem value="7">Vence em até 7 dias</SelectItem>
                <SelectItem value="30">Vence em até 30 dias</SelectItem>
                <SelectItem value="sem">Sem prazo definido</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Ordenar por">
            <Select value={ordem} onValueChange={setOrdem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prazo">Prazo mais próximo</SelectItem>
                <SelectItem value="prazo-distante">Prazo mais distante</SelectItem>
                <SelectItem value="numero">Número do processo</SelectItem>
                <SelectItem value="recentes">Mais recentes</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {resultados.length} resultado(s) encontrado(s)
        </p>
        <Button variant="ghost" size="sm" onClick={limpar}>
          Limpar filtros
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        {resultados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum processo encontrado.{" "}
            {ehAdvogado ? (
              <Link to="/processos/novo" className="text-primary underline">
                Cadastrar novo processo
              </Link>
            ) : null}
          </p>
        ) : (
          resultados.map((p) => (
            <ProcessoCard key={p.id} processo={p} podeExcluir={ehAdvogado} onExcluir={excluir} />
          ))
        )}
      </div>
    </AppShell>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
