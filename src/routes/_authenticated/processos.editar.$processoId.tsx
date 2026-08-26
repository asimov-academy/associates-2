import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { obterProcesso } from "@/lib/queries";
import { AppShell } from "@/components/AppShell";
import { ProcessoForm } from "@/components/ProcessoForm";

export const Route = createFileRoute("/_authenticated/processos/editar/$processoId")({
  head: () => ({
    meta: [
      { title: "Editar processo — Asimov Associates" },
      {
        name: "description",
        content:
          "Atualize dados, prazos, situação e responsáveis de um processo já cadastrado no escritório.",
      },
      { property: "og:title", content: "Editar processo — Asimov Associates" },
      {
        property: "og:description",
        content: "Edição de processo com validação de campos obrigatórios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditarProcessoPage,
});

function EditarProcessoPage() {
  const { processoId } = Route.useParams();
  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", processoId],
    queryFn: () => obterProcesso(processoId),
  });

  if (isLoading) {
    return (
      <AppShell titulo="Editar processo">
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
      titulo={`Editar processo nº ${processo.numero}`}
      descricao="Campos marcados com * são obrigatórios. O número do processo não pode ser alterado."
    >
      <ProcessoForm processo={processo} />
    </AppShell>
  );
}
