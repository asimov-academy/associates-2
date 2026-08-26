import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarClientes, listarPerfis } from "@/lib/queries";
import {
  ACOES,
  FASES,
  INSTANCIAS,
  TIPOS_PROCESSO,
  VARAS,
  formatarCpf,
  type Processo,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormState {
  numero: string;
  tipo: string;
  acao: string;
  vara: string;
  fase: string;
  instancia: string;
  data_inicial: string;
  data_final: string;
  concluido: boolean;
  vencido: boolean;
  valor_causa: string;
  proximo_prazo: string;
  descricao: string;
  clientes: string[];
  advogados: string[];
}

const VAZIO: FormState = {
  numero: "",
  tipo: TIPOS_PROCESSO[0],
  acao: ACOES[0],
  vara: VARAS[0],
  fase: FASES[0],
  instancia: INSTANCIAS[0],
  data_inicial: new Date().toISOString().slice(0, 10),
  data_final: "",
  concluido: false,
  vencido: false,
  valor_causa: "",
  proximo_prazo: "",
  descricao: "",
  clientes: [],
  advogados: [],
};

type Erros = Partial<Record<keyof FormState, string>>;

export function validarProcesso(form: FormState): Erros {
  const erros: Erros = {};
  const numero = form.numero.trim();
  if (!numero) erros.numero = "Informe o número do processo.";
  else if (numero.replace(/\D/g, "").length < 4)
    erros.numero = "O número deve conter ao menos 4 dígitos.";

  if (!form.tipo) erros.tipo = "Selecione o tipo.";
  if (!form.acao) erros.acao = "Selecione a ação.";
  if (!form.vara) erros.vara = "Selecione a vara.";
  if (!form.fase) erros.fase = "Selecione a fase.";
  if (!form.instancia) erros.instancia = "Selecione a instância.";

  if (!form.data_inicial) erros.data_inicial = "Informe a data inicial.";

  if (form.proximo_prazo && form.data_inicial && form.proximo_prazo < form.data_inicial)
    erros.proximo_prazo = "O prazo não pode ser anterior à data inicial.";

  if (form.concluido) {
    if (!form.data_final) erros.data_final = "Processos concluídos exigem data final.";
    else if (form.data_inicial && form.data_final < form.data_inicial)
      erros.data_final = "A data final não pode ser anterior à data inicial.";
  }

  if (form.valor_causa) {
    const valor = Number(form.valor_causa);
    if (Number.isNaN(valor) || valor < 0)
      erros.valor_causa = "Informe um valor válido (maior ou igual a zero).";
  }

  if (form.clientes.length === 0) erros.clientes = "Vincule ao menos um cliente.";
  if (form.advogados.length === 0) erros.advogados = "Vincule ao menos um advogado responsável.";

  return erros;
}

export function ProcessoForm({ processo }: { processo: Processo | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const advogados = perfis.filter((p) => p.papel === "advogado");

  useEffect(() => {
    if (!processo) return;
    setForm({
      numero: processo.numero,
      tipo: processo.tipo,
      acao: processo.acao,
      vara: processo.vara,
      fase: processo.fase,
      instancia: processo.instancia,
      data_inicial: processo.data_inicial,
      data_final: processo.data_final ?? "",
      concluido: processo.concluido,
      vencido: processo.vencido,
      valor_causa: processo.valor_causa ? String(processo.valor_causa) : "",
      proximo_prazo: processo.proximo_prazo ?? "",
      descricao: processo.descricao ?? "",
      clientes: processo.clientes.map((c) => c.id),
      advogados: processo.advogados.map((a) => a.id),
    });
  }, [processo]);

  function atualizar(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
    setErros((e) => {
      const copia = { ...e };
      for (const chave of Object.keys(patch) as (keyof FormState)[]) delete copia[chave];
      return copia;
    });
  }

  function alternar(campo: "clientes" | "advogados", id: string) {
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id],
    }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const encontrados = validarProcesso(form);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      toast.error("Verifique os campos obrigatórios", {
        description: "Há campos com erro no formulário.",
      });
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        tipo: form.tipo,
        acao: form.acao,
        vara: form.vara,
        fase: form.fase,
        instancia: form.instancia,
        data_inicial: form.data_inicial,
        data_final: form.concluido ? form.data_final || null : null,
        concluido: form.concluido,
        vencido: form.concluido ? form.vencido : false,
        valor_causa: form.valor_causa ? Number(form.valor_causa) : null,
        proximo_prazo: form.proximo_prazo || null,
        descricao: form.descricao.trim() || null,
      };

      let processoId = processo?.id;

      if (processo) {
        const { error } = await supabase
          .from("processos")
          .update(payload)
          .eq("id", processo.id);
        if (error) throw error;
        await supabase.from("processo_clientes").delete().eq("processo_id", processo.id);
        await supabase.from("processo_advogados").delete().eq("processo_id", processo.id);
      } else {
        const { data, error } = await supabase
          .from("processos")
          .insert({ ...payload, numero: form.numero.trim() })
          .select("id")
          .single();
        if (error) throw error;
        processoId = (data as { id: string }).id;
      }

      if (processoId) {
        if (form.clientes.length) {
          const { error } = await supabase
            .from("processo_clientes")
            .insert(form.clientes.map((cliente_id) => ({ processo_id: processoId!, cliente_id })));
          if (error) throw error;
        }
        if (form.advogados.length) {
          const { error } = await supabase
            .from("processo_advogados")
            .insert(
              form.advogados.map((advogado_id) => ({ processo_id: processoId!, advogado_id })),
            );
          if (error) throw error;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["processos"] });
      await queryClient.invalidateQueries({ queryKey: ["processo"] });
      toast.success(processo ? "Processo atualizado" : "Processo cadastrado");
      navigate({ to: "/processos/$processoId", params: { processoId: processoId! } });
    } catch (erro) {
      toast.error("Não foi possível salvar", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="max-w-4xl space-y-8">
      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="numero">
            Número do processo <Obrigatorio />
          </Label>
          <Input
            id="numero"
            maxLength={60}
            value={form.numero}
            disabled={!!processo}
            aria-invalid={!!erros.numero}
            className={cn(erros.numero && "border-destructive")}
            onChange={(e) => atualizar({ numero: e.target.value })}
          />
          <Mensagem erro={erros.numero}>
            {processo ? "O número não pode ser alterado após a criação." : null}
          </Mensagem>
        </div>
        <CampoSelect
          label="Tipo de processo"
          obrigatorio
          valor={form.tipo}
          opcoes={TIPOS_PROCESSO}
          erro={erros.tipo}
          onChange={(v) => atualizar({ tipo: v })}
        />
        <CampoSelect
          label="Ação"
          obrigatorio
          valor={form.acao}
          opcoes={ACOES}
          erro={erros.acao}
          onChange={(v) => atualizar({ acao: v })}
        />
        <CampoSelect
          label="Vara"
          obrigatorio
          valor={form.vara}
          opcoes={VARAS}
          erro={erros.vara}
          onChange={(v) => atualizar({ vara: v })}
        />
        <CampoSelect
          label="Fase"
          obrigatorio
          valor={form.fase}
          opcoes={FASES}
          erro={erros.fase}
          onChange={(v) => atualizar({ fase: v })}
        />
        <CampoSelect
          label="Instância"
          obrigatorio
          valor={form.instancia}
          opcoes={INSTANCIAS}
          erro={erros.instancia}
          onChange={(v) => atualizar({ instancia: v })}
        />
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="data_inicial">
            Data inicial <Obrigatorio />
          </Label>
          <Input
            id="data_inicial"
            type="date"
            value={form.data_inicial}
            aria-invalid={!!erros.data_inicial}
            className={cn(erros.data_inicial && "border-destructive")}
            onChange={(e) => atualizar({ data_inicial: e.target.value })}
          />
          <Mensagem erro={erros.data_inicial} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proximo_prazo">Próximo prazo processual</Label>
          <Input
            id="proximo_prazo"
            type="date"
            value={form.proximo_prazo}
            aria-invalid={!!erros.proximo_prazo}
            className={cn(erros.proximo_prazo && "border-destructive")}
            onChange={(e) => atualizar({ proximo_prazo: e.target.value })}
          />
          <Mensagem erro={erros.proximo_prazo} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor_causa">Valor da causa (R$)</Label>
          <Input
            id="valor_causa"
            type="number"
            step="0.01"
            min="0"
            value={form.valor_causa}
            aria-invalid={!!erros.valor_causa}
            className={cn(erros.valor_causa && "border-destructive")}
            onChange={(e) => atualizar({ valor_causa: e.target.value })}
          />
          <Mensagem erro={erros.valor_causa} />
        </div>
        {form.concluido ? (
          <div className="space-y-2">
            <Label htmlFor="data_final">
              Data final <Obrigatorio />
            </Label>
            <Input
              id="data_final"
              type="date"
              value={form.data_final}
              aria-invalid={!!erros.data_final}
              className={cn(erros.data_final && "border-destructive")}
              onChange={(e) => atualizar({ data_final: e.target.value })}
            />
            <Mensagem erro={erros.data_final} />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-8 md:col-span-2">
          <div className="flex items-center gap-3">
            <Switch
              id="concluido"
              checked={form.concluido}
              onCheckedChange={(v) => atualizar({ concluido: v })}
            />
            <Label htmlFor="concluido">Processo concluído</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="vencido"
              checked={form.vencido}
              disabled={!form.concluido}
              onCheckedChange={(v) => atualizar({ vencido: v })}
            />
            <Label htmlFor="vencido">Perdido / vencido</Label>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <ListaSelecao
          titulo="Clientes"
          obrigatorio
          vazio="Nenhum cliente cadastrado."
          erro={erros.clientes}
          itens={clientes.map((c) => ({ id: c.id, rotulo: c.nome, apoio: formatarCpf(c.cpf) }))}
          selecionados={form.clientes}
          onToggle={(id) => alternar("clientes", id)}
        />
        <ListaSelecao
          titulo="Advogados responsáveis"
          obrigatorio
          vazio="Nenhum advogado cadastrado."
          erro={erros.advogados}
          itens={advogados.map((a) => ({
            id: a.id,
            rotulo: a.nome,
            apoio: a.area_atuacao ?? "",
          }))}
          selecionados={form.advogados}
          onToggle={(id) => alternar("advogados", id)}
        />

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            rows={4}
            maxLength={2000}
            value={form.descricao}
            onChange={(e) => atualizar({ descricao: e.target.value })}
          />
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : processo ? "Salvar alterações" : "Cadastrar processo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            processo
              ? navigate({ to: "/processos/$processoId", params: { processoId: processo.id } })
              : navigate({ to: "/processos" })
          }
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Obrigatorio() {
  return (
    <span className="text-destructive" aria-hidden>
      *
    </span>
  );
}

function Mensagem({
  erro,
  children,
}: {
  erro?: string | undefined;
  children?: React.ReactNode | undefined;
}) {
  if (erro) return <p className="text-xs text-destructive">{erro}</p>;
  if (children) return <p className="text-xs text-muted-foreground">{children}</p>;
  return null;
}

function CampoSelect({
  label,
  valor,
  opcoes,
  erro,
  obrigatorio,
  onChange,
}: {
  label: string;
  valor: string;
  opcoes: readonly string[];
  erro?: string | undefined;
  obrigatorio?: boolean | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {obrigatorio ? <Obrigatorio /> : null}
      </Label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger className={cn(erro && "border-destructive")}>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Mensagem erro={erro} />
    </div>
  );
}

function ListaSelecao({
  titulo,
  vazio,
  itens,
  selecionados,
  erro,
  obrigatorio,
  onToggle,
}: {
  titulo: string;
  vazio: string;
  itens: { id: string; rotulo: string; apoio?: string }[];
  selecionados: string[];
  erro?: string | undefined;
  obrigatorio?: boolean | undefined;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {titulo} {obrigatorio ? <Obrigatorio /> : null}
      </Label>
      <div
        className={cn(
          "max-h-48 space-y-2 overflow-y-auto rounded-md border p-3",
          erro ? "border-destructive" : "border-border",
        )}
      >
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{vazio}</p>
        ) : (
          itens.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={selecionados.includes(item.id)}
                onCheckedChange={() => onToggle(item.id)}
              />
              <span className="truncate">
                {item.rotulo}
                {item.apoio ? <span className="text-muted-foreground"> · {item.apoio}</span> : null}
              </span>
            </label>
          ))
        )}
      </div>
      <Mensagem erro={erro} />
    </div>
  );
}
