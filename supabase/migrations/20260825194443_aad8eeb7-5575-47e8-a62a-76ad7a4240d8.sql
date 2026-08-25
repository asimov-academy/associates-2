CREATE TYPE public.app_role AS ENUM ('advogado', 'secretaria');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text,
  oab text,
  area_atuacao text,
  papel public.app_role NOT NULL DEFAULT 'advogado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_advogado()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'advogado'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_advogado());

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _papel public.app_role;
BEGIN
  _papel := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'papel', ''), 'advogado')::public.app_role;

  INSERT INTO public.profiles (user_id, nome, email, oab, area_atuacao, papel)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'nome', ''), NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'oab', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'area_atuacao', ''),
    _papel
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _papel)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL,
  rg text,
  data_nascimento date,
  telefone text,
  email text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE TO authenticated USING (public.is_advogado());
CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  tipo text NOT NULL,
  acao text NOT NULL,
  vara text NOT NULL,
  fase text NOT NULL,
  instancia text NOT NULL,
  data_inicial date NOT NULL,
  data_final date,
  concluido boolean NOT NULL DEFAULT false,
  vencido boolean NOT NULL DEFAULT false,
  valor_causa numeric(14,2),
  proximo_prazo date,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos TO authenticated;
GRANT ALL ON public.processos TO service_role;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processos_select" ON public.processos FOR SELECT TO authenticated USING (true);
CREATE POLICY "processos_insert" ON public.processos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "processos_update" ON public.processos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "processos_delete" ON public.processos FOR DELETE TO authenticated USING (public.is_advogado());
CREATE TRIGGER processos_updated_at BEFORE UPDATE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.protect_processo_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero IS DISTINCT FROM OLD.numero THEN
    RAISE EXCEPTION 'O número do processo não pode ser alterado';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER processos_numero_imutavel BEFORE UPDATE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.protect_processo_numero();

CREATE TABLE public.processo_clientes (
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  PRIMARY KEY (processo_id, cliente_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processo_clientes TO authenticated;
GRANT ALL ON public.processo_clientes TO service_role;
ALTER TABLE public.processo_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_select" ON public.processo_clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "pc_insert" ON public.processo_clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pc_delete" ON public.processo_clientes FOR DELETE TO authenticated USING (true);

CREATE TABLE public.processo_advogados (
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  advogado_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (processo_id, advogado_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processo_advogados TO authenticated;
GRANT ALL ON public.processo_advogados TO service_role;
ALTER TABLE public.processo_advogados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pa_select" ON public.processo_advogados FOR SELECT TO authenticated USING (true);
CREATE POLICY "pa_insert" ON public.processo_advogados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pa_delete" ON public.processo_advogados FOR DELETE TO authenticated USING (true);

CREATE TABLE public.movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  data date NOT NULL,
  descricao text NOT NULL,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  registrado_em timestamptz NOT NULL DEFAULT now(),
  alterado_por_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  alterado_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO authenticated;
GRANT ALL ON public.movimentacoes TO service_role;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov_select" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "mov_insert" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mov_update" ON public.movimentacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mov_delete" ON public.movimentacoes FOR DELETE TO authenticated USING (public.is_advogado());

CREATE OR REPLACE FUNCTION public.movimentacao_autoria()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.autor_id := COALESCE(NEW.autor_id, public.current_profile_id());
    NEW.registrado_em := now();
    NEW.alterado_por_id := NULL;
    NEW.alterado_em := NULL;
  ELSE
    NEW.autor_id := OLD.autor_id;
    NEW.registrado_em := OLD.registrado_em;
    NEW.alterado_por_id := public.current_profile_id();
    NEW.alterado_em := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER movimentacoes_autoria BEFORE INSERT OR UPDATE ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.movimentacao_autoria();

CREATE TABLE public.anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  movimentacao_id uuid REFERENCES public.movimentacoes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  nome text NOT NULL,
  tamanho bigint,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anexo_vinculo CHECK (
    (processo_id IS NOT NULL AND movimentacao_id IS NULL) OR
    (processo_id IS NULL AND movimentacao_id IS NOT NULL)
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos TO authenticated;
GRANT ALL ON public.anexos TO service_role;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_select" ON public.anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos_insert" ON public.anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anexos_delete" ON public.anexos FOR DELETE TO authenticated USING (public.is_advogado());

CREATE POLICY "anexos_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'anexos');
CREATE POLICY "anexos_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anexos');
CREATE POLICY "anexos_remove" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anexos' AND public.is_advogado());
