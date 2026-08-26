import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { ProcessoForm } from "@/components/ProcessoForm";

export const Route = createFileRoute("/_authenticated/processos/novo")({
  head: () => ({
    meta: [
      { title: "Novo processo — Asimov Associates" },
      {
        name: "description",
        content:
          "Cadastre um novo processo com número, ação, vara, prazos, clientes e advogados responsáveis.",
      },
      { property: "og:title", content: "Novo processo — Asimov Associates" },
      {
        property: "og:description",
        content: "Cadastro de processo com validação de campos obrigatórios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovoProcessoPage,
});

function NovoProcessoPage() {
  return (
    <AppShell
      titulo="Novo processo"
      descricao="Campos marcados com * são obrigatórios. Os dados são gravados no banco e aparecem no painel."
    >
      <ProcessoForm processo={null} />
    </AppShell>
  );
}
