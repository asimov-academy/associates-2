import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarClientes } from "@/lib/queries";
import { formatarCpf, formatarData, type Cliente } from "@/lib/domain";
import { useEhAdvogado } from "@/hooks/useSessao";
import { AppShell } from "@/components/AppShell";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Asimov Associates" },
      {
        name: "description",
        content: "Cadastro de clientes do escritório com CPF, RG, contato e endereço.",
      },
      { property: "og:title", content: "Clientes — Asimov Associates" },
      {
        property: "og:description",
        content: "Cadastro de clientes do escritório com CPF, contato e endereço.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientesPage,
});

const VAZIO = {
  nome: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  endereco: "",
};

function ClientesPage() {
  const queryClient = useQueryClient();
  const ehAdvogado = useEhAdvogado();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ ...VAZIO });
  const [salvando, setSalvando] = useState(false);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: listarClientes,
  });

  function abrirNovo() {
    setEditando(null);
    setForm({ ...VAZIO });
    setAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setEditando(cliente);
    setForm({
      nome: cliente.nome,
      cpf: cliente.cpf,
      rg: cliente.rg ?? "",
      data_nascimento: cliente.data_nascimento ?? "",
      telefone: cliente.telefone ?? "",
      email: cliente.email ?? "",
      endereco: cliente.endereco ?? "",
    });
    setAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const cpfDigitos = form.cpf.replace(/\D/g, "");
    if (cpfDigitos.length !== 11) {
      toast.error("Informe um CPF com 11 dígitos");
      return;
    }
    setSalvando(true);
    const payload = {
      nome: form.nome.trim(),
      cpf: cpfDigitos,
      rg: form.rg.trim() || null,
      data_nascimento: form.data_nascimento || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      endereco: form.endereco.trim() || null,
    };
    const { error } = editando
      ? await supabase.from("clientes").update(payload).eq("id", editando.id)
      : await supabase.from("clientes").insert(payload);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["clientes"] });
    setAberto(false);
    toast.success(editando ? "Cliente atualizado" : "Cliente cadastrado");
  }

  async function excluir(cliente: Cliente) {
    if (!window.confirm(`Excluir o cliente ${cliente.nome}?`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", cliente.id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["clientes"] });
    toast.success("Cliente excluído");
  }

  return (
    <AppShell
      titulo="Clientes"
      descricao="Cadastro de clientes atendidos pelo escritório."
      acoes={
        <Button onClick={abrirNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
      }
    >
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>RG</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{formatarCpf(c.cpf)}</TableCell>
                  <TableCell>{c.rg ?? "—"}</TableCell>
                  <TableCell>{formatarData(c.data_nascimento)}</TableCell>
                  <TableCell>{c.telefone ?? "—"}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar cliente"
                      onClick={() => abrirEdicao(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {ehAdvogado ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir cliente"
                        onClick={() => excluir(c)}
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
              {editando ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>Dados cadastrais do cliente.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  required
                  maxLength={14}
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  maxLength={20}
                  value={form.rg}
                  onChange={(e) => setForm({ ...form, rg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nascimento">Data de nascimento</Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  maxLength={20}
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                maxLength={255}
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
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
