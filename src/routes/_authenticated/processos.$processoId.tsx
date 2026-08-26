import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileDown,
  History,
  Lock,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  baixarAnexo,
  enviarAnexo,
  listarAnexosDasMovimentacoes,
  listarAnexosDoProcesso,
  listarHistoricoDoProcesso,
  listarHistoricoProcesso,
  listarMovimentacoes,
  obterProcesso,
  removerAnexo,
} from "@/lib/queries";
import {
  ROTULOS_CAMPO_PROCESSO,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarValorHistorico,
  prazoUrgente,
  resultadoProcesso,
  type Anexo,
  type HistoricoMovimentacao,
  type HistoricoProcesso,
  type Movimentacao,
} from "@/lib/domain";
import { gerarPdfProcesso } from "@/lib/pdfProcesso";
import { useEhAdvogado, usePerfilAtual } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/processos/$processoId")({
  head: () => ({
    meta: [
      { title: "Detalhe do processo — Asimov Associates" },
      {
        name: "description",
        content:
          "Dados completos do processo, linha do tempo de movimentações e documentos anexados.",
      },
      { property: "og:title", content: "Detalhe do processo — Asimov Associates" },
      {
        property: "og:description",
        content: "Movimentações, prazos e documentos do processo.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DetalheProcesso,
});

function DetalheProcesso() {
  const { processoId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const { data: perfil } = usePerfilAtual();

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", processoId],
    queryFn: () => obterProcesso(processoId),
  });
  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["movimentacoes", processoId],
    queryFn: () => listarMovimentacoes(processoId),
  });
  const { data: historico = [] } = useQuery({
    queryKey: ["historico-movimentacoes", processoId],
    queryFn: () => listarHistoricoDoProcesso(processoId),
  });
  const { data: anexosProcesso = [] } = useQuery({
    queryKey: ["anexos-processo", processoId],
    queryFn: () => listarAnexosDoProcesso(processoId),
  });
  const idsMov = useMemo(() => movimentacoes.map((m) => m.id), [movimentacoes]);
  const { data: anexosMov = [] } = useQuery({
    queryKey: ["anexos-movimentacoes", idsMov],
    queryFn: () => listarAnexosDasMovimentacoes(idsMov),
    enabled: idsMov.length > 0,
  });
  const { data: historicoProcesso = [] } = useQuery({
    queryKey: ["historico-processo", processoId],
    queryFn: () => listarHistoricoProcesso(processoId),
  });

  function invalidarTudo() {
    queryClient.invalidateQueries({ queryKey: ["processo", processoId] });
    queryClient.invalidateQueries({ queryKey: ["processos"] });
    queryClient.invalidateQueries({ queryKey: ["movimentacoes", processoId] });
    queryClient.invalidateQueries({ queryKey: ["anexos-processo", processoId] });
    queryClient.invalidateQueries({ queryKey: ["anexos-movimentacoes"] });
    queryClient.invalidateQueries({ queryKey: ["historico-movimentacoes", processoId] });
    queryClient.invalidateQueries({ queryKey: ["historico-processo", processoId] });
  }

  function baixarPdf() {
    if (!processo) return;
    try {
      gerarPdfProcesso({
        processo,
        movimentacoes,
        anexosProcesso,
        anexosMovimentacoes: anexosMov,
      });
      toast.success("PDF gerado", { description: "O download começou automaticamente." });
    } catch (erro) {
      toast.error("Não foi possível gerar o PDF", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    }
  }

  async function excluirProcesso() {
    if (!processo) return;
    if (!ehAdvogado) {
      toast.error("Exclusão não permitida", {
        description:
          "Somente advogados podem excluir processos. Peça a um advogado do escritório.",
      });
      return;
    }
    if (!window.confirm(`Excluir o processo nº ${processo.numero}? Esta ação é definitiva.`))
      return;
    const { error } = await supabase.from("processos").delete().eq("id", processo.id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    toast.success("Processo excluído");
    navigate({ to: "/processos" });
  }

  if (isLoading) {
    return (
      <AppShell titulo="Processo">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  if (!processo) {
    return (
      <AppShell titulo="Processo não encontrado">
        <Link to="/processos" className="text-sm text-primary underline">
          Voltar para processos
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo={`Processo nº ${processo.numero}`}
      descricao={`${processo.acao} · ${processo.tipo} · ${processo.vara}`}
      acoes={
        <>
          <Button variant="outline" onClick={() => navigate({ to: "/processos" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button variant="outline" onClick={baixarPdf}>
            <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
          </Button>
          {ehAdvogado ? (
            <Button variant="outline" asChild>
              <Link to="/processos/editar/$processoId" params={{ processoId }}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              title="Somente advogados podem editar processos"
              onClick={() =>
                toast.error("Edição não permitida", {
                  description: "A secretaria tem acesso somente para consulta.",
                })
              }
            >
              <Lock className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
          <Button
            variant={ehAdvogado ? "destructive" : "outline"}
            onClick={excluirProcesso}
            title={ehAdvogado ? "Excluir processo" : "Somente advogados podem excluir processos"}
          >
            {ehAdvogado ? (
              <Trash2 className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Excluir
          </Button>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant={processo.concluido ? "secondary" : "default"}>
                {processo.concluido ? "Concluído" : "Em andamento"}
              </Badge>
              <Badge variant="outline">Fase: {processo.fase}</Badge>
              <Badge variant="outline">{processo.instancia}</Badge>
              {processo.concluido ? (
                <Badge variant={processo.vencido ? "destructive" : "outline"}>
                  {resultadoProcesso(processo)}
                </Badge>
              ) : null}
              {prazoUrgente(processo) ? (
                <Badge variant="destructive">
                  Prazo em {formatarData(processo.proximo_prazo)}
                </Badge>
              ) : null}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm md:grid-cols-3">
              <Campo rotulo="Data inicial" valor={formatarData(processo.data_inicial)} />
              <Campo rotulo="Data final" valor={formatarData(processo.data_final)} />
              <Campo
                rotulo="Próximo prazo"
                valor={formatarData(processo.proximo_prazo)}
              />
              <Campo rotulo="Valor da causa" valor={formatarMoeda(processo.valor_causa)} />
              <Campo
                rotulo="Cliente(s)"
                valor={processo.clientes.map((c) => c.nome).join(", ") || "—"}
              />
              <Campo
                rotulo="Advogado(s)"
                valor={processo.advogados.map((a) => a.nome).join(", ") || "—"}
              />
            </dl>

            {processo.descricao ? (
              <p className="mt-5 border-t border-border pt-4 text-sm whitespace-pre-line">
                {processo.descricao}
              </p>
            ) : null}
          </section>

          <LinhaDoTempo
            processoId={processoId}
            movimentacoes={movimentacoes}
            historico={historico}
            anexos={anexosMov}
            autorId={perfil?.id ?? null}
            podeEditar={ehAdvogado}
            onMudou={invalidarTudo}
          />

          <HistoricoDoProcesso registros={historicoProcesso} />
        </div>

        <PainelAnexos
          anexos={anexosProcesso}
          processoId={processoId}
          autorId={perfil?.id ?? null}
          podeEditar={ehAdvogado}
          onMudou={invalidarTudo}
        />
      </div>
    </AppShell>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5">{valor}</dd>
    </div>
  );
}

function LinhaDoTempo({
  processoId,
  movimentacoes,
  historico,
  anexos,
  autorId,
  podeExcluir,
  onMudou,
}: {
  processoId: string;
  movimentacoes: Movimentacao[];
  historico: HistoricoMovimentacao[];
  anexos: Anexo[];
  autorId: string | null;
  podeExcluir: boolean;
  onMudou: () => void;
}) {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [dataEdicao, setDataEdicao] = useState("");

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setSalvando(true);
    const { error } = await supabase.from("movimentacoes").insert({
      processo_id: processoId,
      data,
      descricao: descricao.trim(),
      autor_id: autorId,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível registrar", { description: error.message });
      return;
    }
    setDescricao("");
    onMudou();
    toast.success("Movimentação registrada");
  }

  async function salvarEdicao(id: string) {
    const texto = textoEdicao.trim();
    if (!texto) {
      toast.error("A descrição não pode ficar vazia");
      return;
    }
    const { error } = await supabase
      .from("movimentacoes")
      .update({
        descricao: texto,
        data: dataEdicao,
        alterado_por_id: autorId,
        alterado_em: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    setEditandoId(null);
    onMudou();
    toast.success("Movimentação atualizada", {
      description: "A versão anterior foi guardada no histórico de alterações.",
    });
  }

  async function excluir(id: string) {
    if (!podeExcluir) {
      toast.error("Exclusão não permitida", {
        description: "Somente advogados podem excluir movimentações.",
      });
      return;
    }
    if (!window.confirm("Excluir esta movimentação?")) return;
    const { error } = await supabase.from("movimentacoes").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    onMudou();
    toast.success("Movimentação excluída");
  }


  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-serif text-lg font-semibold">Linha do tempo</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada movimentação registra quem escreveu e quando. Ao editar, o sistema guarda o autor da
        alteração, a data/hora e o conteúdo anterior.
      </p>

      <form onSubmit={registrar} className="mt-4 space-y-3 rounded-md bg-muted/40 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="mov-data">Data</Label>
            <Input
              id="mov-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
        <Textarea
          rows={3}
          maxLength={2000}
          placeholder="Descreva a movimentação do processo…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={salvando}>
          Registrar movimentação
        </Button>
      </form>

      <ol className="mt-6 space-y-5 border-l border-border pl-6">
        {movimentacoes.length === 0 ? (
          <p className="-ml-6 text-sm text-muted-foreground">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          movimentacoes.map((m) => {
            const doItem = anexos.filter((a) => a.movimentacao_id === m.id);
            const versoes = historico.filter((h) => h.movimentacao_id === m.id);
            return (
              <li key={m.id} className="relative">
                <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{formatarData(m.data)}</p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar movimentação"
                      onClick={() => {
                        setEditandoId(m.id);
                        setTextoEdicao(m.descricao);
                        setDataEdicao(m.data);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        podeExcluir
                          ? "Excluir movimentação"
                          : "Exclusão permitida apenas a advogados"
                      }
                      title={
                        podeExcluir
                          ? "Excluir movimentação"
                          : "Somente advogados podem excluir movimentações"
                      }
                      className={podeExcluir ? undefined : "opacity-50"}
                      onClick={() => excluir(m.id)}
                    >
                      {podeExcluir ? (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {editandoId === m.id ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      type="date"
                      className="w-44"
                      value={dataEdicao}
                      onChange={(e) => setDataEdicao(e.target.value)}
                    />
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      value={textoEdicao}
                      onChange={(e) => setTextoEdicao(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => salvarEdicao(m.id)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm whitespace-pre-line">{m.descricao}</p>
                )}

                <p className="mt-1 text-xs text-muted-foreground">
                  Registrado por {m.autor?.nome ?? "—"} em {formatarDataHora(m.registrado_em)}
                  {m.alterado_em
                    ? ` · editado por ${m.alterado_por?.nome ?? "—"} em ${formatarDataHora(m.alterado_em)}`
                    : ""}
                </p>

                {versoes.length > 0 ? (
                  <details className="mt-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                    <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Histórico de alterações ({versoes.length})
                    </summary>
                    <ul className="mt-2 space-y-3">
                      {versoes.map((h) => (
                        <li key={h.id} className="border-l-2 border-border pl-3 text-xs">
                          <p className="font-medium">
                            {h.alterado_por?.nome ?? "—"} · {formatarDataHora(h.alterado_em)}
                          </p>
                          {h.data_anterior !== h.data_nova ? (
                            <p className="mt-1 text-muted-foreground">
                              Data: {formatarData(h.data_anterior)} → {formatarData(h.data_nova)}
                            </p>
                          ) : null}
                          {h.descricao_anterior !== h.descricao_nova ? (
                            <>
                              <p className="mt-1 text-muted-foreground">Texto anterior:</p>
                              <p className="whitespace-pre-line text-muted-foreground line-through">
                                {h.descricao_anterior ?? "—"}
                              </p>
                              <p className="mt-1 text-muted-foreground">Texto novo:</p>
                              <p className="whitespace-pre-line">{h.descricao_nova ?? "—"}</p>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <AnexosLinha
                  anexos={doItem}
                  podeExcluir={podeExcluir}
                  onMudou={onMudou}
                  movimentacaoId={m.id}
                  autorId={autorId}
                />
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}

function AnexosLinha({
  anexos,
  movimentacaoId,
  autorId,
  podeExcluir,
  onMudou,
}: {
  anexos: Anexo[];
  movimentacaoId: string;
  autorId: string | null;
  podeExcluir: boolean;
  onMudou: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    try {
      await enviarAnexo({ arquivo, movimentacaoId, autorId });
      onMudou();
      toast.success("Documento anexado");
    } catch (erro) {
      toast.error("Falha no envio", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    }
  }

  return (
    <div className="mt-2 space-y-1">
      {anexos.map((a) => (
        <ItemAnexo key={a.id} anexo={a} podeExcluir={podeExcluir} onMudou={onMudou} />
      ))}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void enviar(arquivo);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Paperclip className="h-3 w-3" /> Anexar documento
      </button>
    </div>
  );
}

function ItemAnexo({
  anexo,
  podeExcluir,
  onMudou,
}: {
  anexo: Anexo;
  podeExcluir: boolean;
  onMudou: () => void;
}) {
  async function baixar() {
    try {
      await baixarAnexo(anexo);
    } catch (erro) {
      toast.error("Não foi possível baixar", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir o documento "${anexo.nome}"?`)) return;
    try {
      await removerAnexo(anexo);
      onMudou();
      toast.success("Documento excluído");
    } catch (erro) {
      toast.error("Não foi possível excluir", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
      <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{anexo.nome}</span>
      <button type="button" onClick={baixar} aria-label="Baixar documento">
        <Download className="h-3.5 w-3.5 text-primary" />
      </button>
      {podeExcluir ? (
        <button type="button" onClick={excluir} aria-label="Excluir documento">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      ) : null}
    </div>
  );
}

function PainelAnexos({
  anexos,
  processoId,
  autorId,
  podeExcluir,
  onMudou,
}: {
  anexos: Anexo[];
  processoId: string;
  autorId: string | null;
  podeExcluir: boolean;
  onMudou: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(arquivo: File) {
    setEnviando(true);
    try {
      await enviarAnexo({ arquivo, processoId, autorId });
      onMudou();
      toast.success("Documento anexado");
    } catch (erro) {
      toast.error("Falha no envio", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-6">
      <h2 className="font-serif text-lg font-semibold">Documentos do processo</h2>
      <div className="mt-4 space-y-2">
        {anexos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
        ) : (
          anexos.map((a) => (
            <ItemAnexo key={a.id} anexo={a} podeExcluir={podeExcluir} onMudou={onMudou} />
          ))
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void enviar(arquivo);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" /> Anexar documento
      </Button>
    </aside>
  );
}
