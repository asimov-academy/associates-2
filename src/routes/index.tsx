import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Asimov Associates — Gestão de processos do escritório" },
      {
        name: "description",
        content:
          "Sistema interno do escritório Asimov Associates: histórico completo de processos, prazos em destaque e busca por cliente ou CPF.",
      },
      {
        property: "og:title",
        content: "Asimov Associates — Gestão de processos do escritório",
      },
      {
        property: "og:description",
        content:
          "Histórico completo de processos, prazos em destaque e busca instantânea por número, cliente ou CPF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/painel" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}
