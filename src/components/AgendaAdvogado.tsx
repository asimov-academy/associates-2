import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { urlAgendaGoogle, type Profile } from "@/lib/domain";

export function AgendaAdvogado({ perfil }: { perfil: Profile | null | undefined }) {
  const url = urlAgendaGoogle(perfil?.google_agenda);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-lg font-semibold">Minha agenda</h2>
        {perfil?.nome ? (
          <span className="text-sm text-muted-foreground">— {perfil.nome}</span>
        ) : null}
      </header>

      {url ? (
        <iframe
          title="Agenda do Google"
          src={url}
          className="h-[420px] w-full rounded-b-lg border-0"
          loading="lazy"
        />
      ) : (
        <div className="space-y-2 px-5 py-8 text-sm text-muted-foreground">
          <p>Nenhuma agenda do Google vinculada a este cadastro.</p>
          <p>
            Vincule em{" "}
            <Link to="/advogados" className="font-medium text-primary underline">
              Equipe
            </Link>{" "}
            editando seu cadastro e colando o ID ou o link da sua agenda.
          </p>
        </div>
      )}
    </section>
  );
}
