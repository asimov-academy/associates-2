import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarPerfis } from "@/lib/queries";
import { AREAS_ATUACAO, type Papel, type Profile } from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/advogados")({
  head: () => ({
    meta: [
      { title: "Equipe — Asimov Associates" },
      {
        name: "description",
        content: "Advogados e secretárias do escritório, com OAB e área de atuação.",
      },
      { property: "og:title", content: "Equipe — Asimov Associates" },
      {
        property: "og:description",
        content: "Advogados e secretárias do escritório, com OAB e área de atuação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdvogadosPage,
});

const VAZIO = {
  nome: "",
  email: "",
  oab: "",
  area_atuacao: AREAS_ATUACAO[0] as string,
  papel: "advogado" as Papel,
  google_agenda: "",
};

function AdvogadosPage() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Profile | null>(null);
  const [form, setForm] = useState({ ...VAZIO });
  const [salvando, setSalvando] = useState(false);

  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ["perfis"],
    queryFn: listarPerfis,
  });

  function abrirNovo() {
    setEditando(null);
    setForm({ ...VAZIO });
    setAberto(true);
  }

  function abrirEdicao(perfil: Profile) {
    setEditando(perfil);
    setForm({
      nome: perfil.nome,
      email: perfil.email ?? "",
      oab: perfil.oab ?? "",
      area_atuacao: perfil.area_atuacao ?? AREAS_ATUACAO[0],
      papel: perfil.papel,
      google_agenda: perfil.google_agenda ?? "",
    });
    setAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim() || null,
      oab: form.papel === "advogado" ? form.oab.trim() || null : null,
      area_atuacao: form.papel === "advogado" ? form.area_atuacao : null,
      papel: form.papel,
      google_agenda:
        form.papel === "advogado" ? form.google_agenda.trim() || null : null,
    };
    const { error } = editando
      ? await supabase.from("profiles").update(payload).eq("id", editando.id)
      : await supabase.from("profiles").insert(payload);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["perfis"] });
    setAberto(false);
    toast.success(editando ? "Cadastro atualizado" : "Cadastro criado");
  }

  async function excluir(perfil: Profile) {
    if (!window.confirm(`Excluir o cadastro de ${perfil.nome}?`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", perfil.id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["perfis"] });
    toast.success("Cadastro excluído");
  }

  return (
    <AppShell
      titulo="Equipe"
      descricao="Advogados e secretárias com acesso ao sistema."
      acoes={
        <Button onClick={abrirNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo cadastro
        </Button>
      }
    >
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>OAB</TableHead>
              <TableHead>Área de atuação</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : perfis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Nenhum cadastro.
                </TableCell>
              </TableRow>
            ) : (
              perfis.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>
                    <Badge variant={p.papel === "advogado" ? "default" : "secondary"}>
                      {p.papel === "advogado" ? "Advogado" : "Secretária"}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.oab ?? "—"}</TableCell>
                  <TableCell>{p.area_atuacao ?? "—"}</TableCell>
                  <TableCell>{p.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar cadastro"
                      onClick={() => abrirEdicao(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {ehAdvogado ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir cadastro"
                        onClick={() => excluir(p)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editando ? "Editar cadastro" : "Novo cadastro"}
            </DialogTitle>
            <DialogDescription>
              Cadastros criados aqui ficam disponíveis para vincular a processos. O acesso ao
              sistema é criado quando a pessoa se registra com este e-mail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                required
                maxLength={150}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select
                value={form.papel}
                onValueChange={(v) => setForm({ ...form, papel: v as Papel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advogado">Advogado</SelectItem>
                  <SelectItem value="secretaria">Secretária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.papel === "advogado" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oab">Número da OAB</Label>
                  <Input
                    id="oab"
                    maxLength={30}
                    value={form.oab}
                    onChange={(e) => setForm({ ...form, oab: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Área de atuação</Label>
                  <Select
                    value={form.area_atuacao}
                    onValueChange={(v) => setForm({ ...form, area_atuacao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_ATUACAO.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
            {form.papel === "advogado" ? (
              <div className="space-y-2">
                <Label htmlFor="google_agenda">Agenda do Google</Label>
                <Input
                  id="google_agenda"
                  maxLength={400}
                  placeholder="advogado@escritorio.com.br ou link da agenda"
                  value={form.google_agenda}
                  onChange={(e) => setForm({ ...form, google_agenda: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o ID (e-mail) da agenda ou o link de compartilhamento. No Google Agenda:
                  Configurações da agenda → Integrar agenda. A agenda precisa estar compartilhada
                  publicamente para aparecer no painel.
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
