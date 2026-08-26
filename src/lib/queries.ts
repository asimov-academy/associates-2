import { supabase } from "@/integrations/supabase/client";
import type {
  Anexo,
  Cliente,
  HistoricoMovimentacao,
  HistoricoProcesso,
  Movimentacao,
  Processo,
  Profile,
} from "@/lib/domain";

const PROCESSO_SELECT =
  "*, processo_clientes(clientes(*)), processo_advogados(profiles(*))";

interface ProcessoRow {
  processo_clientes?: { clientes: Cliente | null }[] | null;
  processo_advogados?: { profiles: Profile | null }[] | null;
  [key: string]: unknown;
}

function mapProcesso(row: ProcessoRow): Processo {
  const { processo_clientes, processo_advogados, ...resto } = row;
  return {
    ...(resto as unknown as Omit<Processo, "clientes" | "advogados">),
    clientes: (processo_clientes ?? []).map((r) => r.clientes).filter(Boolean) as Cliente[],
    advogados: (processo_advogados ?? []).map((r) => r.profiles).filter(Boolean) as Profile[],
  };
}

export async function listarProcessos(): Promise<Processo[]> {
  const { data, error } = await supabase
    .from("processos")
    .select(PROCESSO_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProcessoRow[]).map(mapProcesso);
}

export async function obterProcesso(id: string): Promise<Processo> {
  const { data, error } = await supabase
    .from("processos")
    .select(PROCESSO_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapProcesso(data as unknown as ProcessoRow);
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Cliente[];
}

export async function listarPerfis(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Profile[];
}

export async function listarMovimentacoes(processoId: string): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*, autor:autor_id(nome), alterado_por:alterado_por_id(nome)")
    .eq("processo_id", processoId)
    .order("data", { ascending: false })
    .order("registrado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Movimentacao[];
}

export async function listarAnexosDoProcesso(processoId: string): Promise<Anexo[]> {
  const { data, error } = await supabase
    .from("anexos")
    .select("*, autor:autor_id(nome)")
    .eq("processo_id", processoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Anexo[];
}

export async function listarAnexosDasMovimentacoes(ids: string[]): Promise<Anexo[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("anexos")
    .select("*, autor:autor_id(nome)")
    .in("movimentacao_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Anexo[];
}

export async function enviarAnexo(params: {
  arquivo: File;
  processoId?: string;
  movimentacaoId?: string;
  autorId: string | null;
}) {
  const { arquivo, processoId, movimentacaoId, autorId } = params;
  const pasta = processoId ? `processos/${processoId}` : `movimentacoes/${movimentacaoId}`;
  const caminho = `${pasta}/${crypto.randomUUID()}-${arquivo.name.replace(/[^\w.\-]/g, "_")}`;

  const upload = await supabase.storage.from("anexos").upload(caminho, arquivo);
  if (upload.error) throw upload.error;

  const { error } = await supabase.from("anexos").insert({
    processo_id: processoId ?? null,
    movimentacao_id: movimentacaoId ?? null,
    storage_path: caminho,
    nome: arquivo.name,
    tamanho: arquivo.size,
    autor_id: autorId,
  });
  if (error) throw error;
}

export async function baixarAnexo(anexo: Anexo) {
  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(anexo.storage_path, 120, { download: anexo.nome });
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

export async function removerAnexo(anexo: Anexo) {
  const { error } = await supabase.from("anexos").delete().eq("id", anexo.id);
  if (error) throw error;
  await supabase.storage.from("anexos").remove([anexo.storage_path]);
}

export async function listarHistoricoDoProcesso(
  processoId: string,
): Promise<HistoricoMovimentacao[]> {
  const { data, error } = await supabase
    .from("movimentacao_historico")
    .select("*, alterado_por:alterado_por_id(nome)")
    .eq("processo_id", processoId)
    .order("alterado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as HistoricoMovimentacao[];
}
