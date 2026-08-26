import { jsPDF } from "jspdf";

import {
  diasAte,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  resultadoProcesso,
  type Anexo,
  type Movimentacao,
  type Processo,
} from "@/lib/domain";

const MARGEM = 48;
const LARGURA = 595.28; // A4 retrato em pt
const ALTURA = 841.89;
const BORDO: [number, number, number] = [123, 45, 59];
const GRAFITE: [number, number, number] = [44, 44, 42];
const CINZA: [number, number, number] = [95, 94, 90];

interface DadosPdf {
  processo: Processo;
  movimentacoes: Movimentacao[];
  anexosProcesso: Anexo[];
  anexosMovimentacoes: Anexo[];
}

export function gerarPdfProcesso({
  processo,
  movimentacoes,
  anexosProcesso,
  anexosMovimentacoes,
}: DadosPdf) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGEM;

  const larguraUtil = LARGURA - MARGEM * 2;

  function novaPaginaSePreciso(altura: number) {
    if (y + altura <= ALTURA - MARGEM) return;
    doc.addPage();
    y = MARGEM;
  }

  function titulo(texto: string) {
    novaPaginaSePreciso(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BORDO);
    doc.text(texto, MARGEM, y);
    y += 8;
    doc.setDrawColor(...BORDO);
    doc.setLineWidth(0.8);
    doc.line(MARGEM, y, LARGURA - MARGEM, y);
    y += 16;
  }

  function paragrafo(texto: string, opcoes?: { negrito?: boolean; cor?: [number, number, number] }) {
    doc.setFont("helvetica", opcoes?.negrito ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(...(opcoes?.cor ?? GRAFITE));
    const linhas = doc.splitTextToSize(texto, larguraUtil) as string[];
    for (const linha of linhas) {
      novaPaginaSePreciso(14);
      doc.text(linha, MARGEM, y);
      y += 14;
    }
  }

  function parDeCampos(esquerda: [string, string], direita?: [string, string]) {
    novaPaginaSePreciso(28);
    const meio = MARGEM + larguraUtil / 2;
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.setFont("helvetica", "normal");
    doc.text(esquerda[0], MARGEM, y);
    if (direita) doc.text(direita[0], meio, y);
    doc.setFontSize(10);
    doc.setTextColor(...GRAFITE);
    doc.text(esquerda[1] || "—", MARGEM, y + 13);
    if (direita) doc.text(direita[1] || "—", meio, y + 13);
    y += 30;
  }

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BORDO);
  doc.text("Asimov Associates", MARGEM, y);
  y += 22;
  doc.setFontSize(14);
  doc.setTextColor(...GRAFITE);
  doc.text(`Processo nº ${processo.numero}`, MARGEM, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...CINZA);
  doc.text(
    `${processo.acao} · ${processo.tipo} · ${processo.vara} · ${processo.instancia}`,
    MARGEM,
    y,
  );
  y += 14;
  doc.text(`Relatório emitido em ${formatarDataHora(new Date().toISOString())}`, MARGEM, y);
  y += 24;

  // Status atual
  titulo("Status atual");
  parDeCampos(
    ["Situação", processo.concluido ? "Concluído" : "Em andamento"],
    ["Resultado", processo.concluido ? resultadoProcesso(processo) : "—"],
  );
  parDeCampos(["Fase", processo.fase], ["Instância", processo.instancia]);
  parDeCampos(
    ["Data inicial", formatarData(processo.data_inicial)],
    ["Data final", formatarData(processo.data_final)],
  );
  parDeCampos(
    ["Valor da causa", formatarMoeda(processo.valor_causa)],
    ["Movimentações registradas", String(movimentacoes.length)],
  );
  parDeCampos(
    ["Cliente(s)", processo.clientes.map((c) => c.nome).join(", ") || "—"],
    ["Advogado(s)", processo.advogados.map((a) => a.nome).join(", ") || "—"],
  );
  if (processo.descricao) {
    paragrafo(processo.descricao);
    y += 6;
  }

  // Próximos prazos
  titulo("Próximos prazos");
  if (processo.concluido) {
    paragrafo("Processo concluído — não há prazos em aberto.");
  } else if (!processo.proximo_prazo) {
    paragrafo("Nenhum prazo definido para este processo.");
  } else {
    const dias = diasAte(processo.proximo_prazo);
    const situacao =
      dias === null
        ? ""
        : dias < 0
          ? `vencido há ${Math.abs(dias)} dia(s)`
          : dias === 0
            ? "vence hoje"
            : `faltam ${dias} dia(s)`;
    const urgente = dias !== null && dias < 7;
    paragrafo(`Próximo prazo: ${formatarData(processo.proximo_prazo)} — ${situacao}`, {
      negrito: urgente,
      cor: urgente ? BORDO : GRAFITE,
    });
  }
  y += 8;

  // Linha do tempo
  titulo("Linha do tempo");
  if (movimentacoes.length === 0) {
    paragrafo("Nenhuma movimentação registrada.");
  } else {
    const cronologicas = [...movimentacoes].sort((a, b) => a.data.localeCompare(b.data));
    for (const m of cronologicas) {
      novaPaginaSePreciso(46);
      paragrafo(formatarData(m.data), { negrito: true });
      paragrafo(m.descricao);
      const autoria = `Registrado por ${m.autor?.nome ?? "—"} em ${formatarDataHora(m.registrado_em)}${
        m.alterado_em
          ? ` · editado por ${m.alterado_por?.nome ?? "—"} em ${formatarDataHora(m.alterado_em)}`
          : ""
      }`;
      paragrafo(autoria, { cor: CINZA });
      const doItem = anexosMovimentacoes.filter((a) => a.movimentacao_id === m.id);
      for (const a of doItem) paragrafo(`Anexo: ${a.nome}`, { cor: CINZA });
      y += 6;
    }
  }

  // Anexos
  titulo("Anexos");
  paragrafo("Documentos do processo", { negrito: true });
  if (anexosProcesso.length === 0) {
    paragrafo("Nenhum documento anexado ao processo.", { cor: CINZA });
  } else {
    for (const a of anexosProcesso) {
      paragrafo(
        `• ${a.nome} — enviado por ${a.autor?.nome ?? "—"} em ${formatarDataHora(a.created_at)}`,
      );
    }
  }
  y += 8;
  paragrafo("Documentos das movimentações", { negrito: true });
  if (anexosMovimentacoes.length === 0) {
    paragrafo("Nenhum documento anexado às movimentações.", { cor: CINZA });
  } else {
    for (const a of anexosMovimentacoes) {
      const mov = movimentacoes.find((m) => m.id === a.movimentacao_id);
      paragrafo(
        `• ${a.nome} — movimentação de ${formatarData(mov?.data ?? null)}, por ${
          a.autor?.nome ?? "—"
        } em ${formatarDataHora(a.created_at)}`,
      );
    }
  }

  // Rodapé com numeração
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(
      `Processo nº ${processo.numero} · página ${p} de ${total}`,
      LARGURA - MARGEM,
      ALTURA - 24,
      { align: "right" },
    );
  }

  const nomeArquivo = `processo-${processo.numero.replace(/[^\w.-]/g, "_")}.pdf`;
  doc.save(nomeArquivo);
}
