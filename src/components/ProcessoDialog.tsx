import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  type Processo,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function ProcessoDialog({
  aberto,
  processo,
  onOpenChange,
}: {
  aberto: boolean;
  processo: Processo | null;
  onOpenChange: (aberto: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: listarClientes,
  });
  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const advogados = perfis.filter((p) => p.papel === "advogado");

  useEffect(() => {
    if (!aberto) return;
    if (processo) {
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
    } else {
      setForm(VAZIO);
    }
  }, [aberto, processo]);

  function alternar(campo: "clientes" | "advogados", id: string) {
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(id)
        ? f[campo].filter((x) => x !== id)
        : [...f[campo], id],
    }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.numero.trim()) {
      toast.error("Informe o número do processo");
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
      onOpenChange(false);
    } catch (erro) {
      toast.error("Não foi possível salvar", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {processo ? `Editar processo nº ${processo.numero}` : "Cadastrar processo"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do processo, vincule clientes e advogados responsáveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do processo</Label>
              <Input
                id="numero"
                required
                maxLength={60}
                value={form.numero}
                disabled={!!processo}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
              {processo ? (
                <p className="text-xs text-muted-foreground">
                  O número não pode ser alterado após a criação.
                </p>
              ) : null}
            </div>
            <CampoSelect
              label="Tipo de processo"
              valor={form.tipo}
              opcoes={TIPOS_PROCESSO}
              onChange={(v) => setForm({ ...form, tipo: v })}
            />
            <CampoSelect
              label="Ação"
              valor={form.acao}
              opcoes={ACOES}
              onChange={(v) => setForm({ ...form, acao: v })}
            />
            <CampoSelect
              label="Vara"
              valor={form.vara}
              opcoes={VARAS}
              onChange={(v) => setForm({ ...form, vara: v })}
            />
            <CampoSelect
              label="Fase"
              valor={form.fase}
              opcoes={FASES}
              onChange={(v) => setForm({ ...form, fase: v })}
            />
            <CampoSelect
              label="Instância"
              valor={form.instancia}
              opcoes={INSTANCIAS}
              onChange={(v) => setForm({ ...form, instancia: v })}
            />
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicial">Data inicial</Label>
              <Input
                id="data_inicial"
                type="date"
                required
                value={form.data_inicial}
                onChange={(e) => setForm({ ...form, data_inicial: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximo_prazo">Próximo prazo processual</Label>
              <Input
                id="proximo_prazo"
                type="date"
                value={form.proximo_prazo}
                onChange={(e) => setForm({ ...form, proximo_prazo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_causa">Valor da causa (R$)</Label>
              <Input
                id="valor_causa"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_causa}
                onChange={(e) => setForm({ ...form, valor_causa: e.target.value })}
              />
            </div>
            {form.concluido ? (
              <div className="space-y-2">
                <Label htmlFor="data_final">Data final</Label>
                <Input
                  id="data_final"
                  type="date"
                  value={form.data_final}
                  onChange={(e) => setForm({ ...form, data_final: e.target.value })}
                />
              </div>
            ) : null}
          </section>

          <section className="flex flex-wrap gap-8 rounded-md border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <Switch
                id="concluido"
                checked={form.concluido}
                onCheckedChange={(v) => setForm({ ...form, concluido: v })}
              />
              <Label htmlFor="concluido">Processo concluído</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="vencido"
                checked={form.vencido}
                disabled={!form.concluido}
                onCheckedChange={(v) => setForm({ ...form, vencido: v })}
              />
              <Label htmlFor="vencido">Perdido / vencido</Label>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <ListaSelecao
              titulo="Clientes"
              vazio="Nenhum cliente cadastrado."
              itens={clientes.map((c) => ({ id: c.id, rotulo: c.nome, apoio: c.cpf }))}
              selecionados={form.clientes}
              onToggle={(id) => alternar("clientes", id)}
            />
            <ListaSelecao
              titulo="Advogados responsáveis"
              vazio="Nenhum advogado cadastrado."
              itens={advogados.map((a) => ({
                id: a.id,
                rotulo: a.nome,
                apoio: a.area_atuacao ?? "",
              }))}
              selecionados={form.advogados}
              onToggle={(id) => alternar("advogados", id)}
            />
          </section>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={3}
              maxLength={2000}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampoSelect({
  label,
  valor,
  opcoes,
  onChange,
}: {
  label: string;
  valor: string;
  opcoes: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ListaSelecao({
  titulo,
  vazio,
  itens,
  selecionados,
  onToggle,
}: {
  titulo: string;
  vazio: string;
  itens: { id: string; rotulo: string; apoio?: string }[];
  selecionados: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{titulo}</Label>
      <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-border p-3">
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
                {item.apoio ? (
                  <span className="text-muted-foreground"> · {item.apoio}</span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
