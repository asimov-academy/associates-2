export const AREAS_ATUACAO = [
  "Cível",
  "Criminal",
  "Trabalhista",
  "Previdenciário",
  "Vara de Família",
] as const;

export const TIPOS_PROCESSO = [
  "Cível",
  "Criminal",
  "Trabalhista",
  "Previdenciário",
  "Família",
] as const;

export const ACOES = [
  "Busca e Apreensão",
  "Consignação",
  "Execução Fiscal",
  "Habeas Corpus",
  "Indenizatória",
  "Inventário",
  "Reclamatória Trabalhista",
  "Revisão de Benefício",
] as const;

export const VARAS = [
  "Civil",
  "Conciliação e Julgamento",
  "Trabalhista",
  "Vara de Família",
] as const;

export const FASES = [
  "Elaboração",
  "Impugnação",
  "Recurso",
  "Execução",
  "Instrução",
  "Suspenso",
] as const;

export const INSTANCIAS = ["1ª Instância", "2ª Instância"] as const;

export type Papel = "advogado" | "secretaria";

export interface Profile {
  id: string;
  user_id: string | null;
  nome: string;
  email: string | null;
  oab: string | null;
  area_atuacao: string | null;
  papel: Papel;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export interface Processo {
  id: string;
  numero: string;
  tipo: string;
  acao: string;
  vara: string;
  fase: string;
  instancia: string;
  data_inicial: string;
  data_final: string | null;
  concluido: boolean;
  vencido: boolean;
  valor_causa: number | string | null;
  proximo_prazo: string | null;
  descricao: string | null;
  clientes: Cliente[];
  advogados: Profile[];
}

export interface Movimentacao {
  id: string;
  processo_id: string;
  data: string;
  descricao: string;
  autor_id: string | null;
  registrado_em: string;
  alterado_por_id: string | null;
  alterado_em: string | null;
  autor?: { nome: string } | null;
  alterado_por?: { nome: string } | null;
}

export interface Anexo {
  id: string;
  processo_id: string | null;
  movimentacao_id: string | null;
  storage_path: string;
  nome: string;
  tamanho: number | null;
  created_at: string;
  autor?: { nome: string } | null;
}

/** Dias entre hoje e a data (negativo = vencido). */
export function diasAte(data: string | null): number | null {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${data}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function prazoUrgente(processo: {
  proximo_prazo: string | null;
  concluido: boolean;
}): boolean {
  if (processo.concluido) return false;
  const dias = diasAte(processo.proximo_prazo);
  return dias !== null && dias < 7;
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return "—";
  const somenteData = data.length <= 10 ? `${data}T00:00:00` : data;
  return new Date(somenteData).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data: string | null | undefined): string {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function resultadoProcesso(p: { concluido: boolean; vencido: boolean }): string {
  if (!p.concluido) return "Em andamento";
  return p.vencido ? "Perdido" : "Vencido";
}
