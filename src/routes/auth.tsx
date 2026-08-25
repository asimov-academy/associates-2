import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AREAS_ATUACAO } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Asimov Associates" },
      {
        name: "description",
        content:
          "Acesso interno ao sistema de gestão de processos do escritório Asimov Associates.",
      },
      { property: "og:title", content: "Entrar — Asimov Associates" },
      {
        property: "og:description",
        content: "Acesso interno ao sistema de gestão de processos do escritório.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<"advogado" | "secretaria">("advogado");
  const [oab, setOab] = useState("");
  const [area, setArea] = useState<string>(AREAS_ATUACAO[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3) {
      toast.error("Informe o nome completo");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/painel`,
        data: {
          nome: nome.trim(),
          papel,
          oab: papel === "advogado" ? oab.trim() : "",
          area_atuacao: papel === "advogado" ? area : "",
        },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível criar o acesso", { description: error.message });
      return;
    }
    toast.success("Acesso criado. Você já pode entrar.");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div>
          <p className="font-serif text-2xl font-semibold">Asimov</p>
          <p className="text-xs tracking-[0.22em] text-sidebar-foreground/60 uppercase">
            Associates
          </p>
        </div>
        <div className="max-w-md">
          <h2 className="font-serif text-3xl leading-tight font-semibold">
            Todo o histórico de cada processo, em um lugar só.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Linha do tempo completa de movimentações, prazos em destaque e busca por
            número, cliente ou CPF — para responder ao cliente ainda durante a ligação.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Uso interno do escritório</p>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl font-semibold">Acesso ao sistema</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Use suas credenciais do escritório.
          </p>

          <Tabs defaultValue="entrar">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="entrar" className="flex-1">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="criar" className="flex-1">
                Criar acesso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={entrar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={criarConta} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    required
                    maxLength={120}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select
                    value={papel}
                    onValueChange={(v) => setPapel(v as "advogado" | "secretaria")}
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
                {papel === "advogado" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="oab">Número da OAB</Label>
                      <Input
                        id="oab"
                        maxLength={40}
                        value={oab}
                        onChange={(e) => setOab(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Área de atuação</Label>
                      <Select value={area} onValueChange={setArea}>
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
                  </>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email-novo">E-mail</Label>
                  <Input
                    id="email-novo"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-nova">Senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  Criar acesso
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
