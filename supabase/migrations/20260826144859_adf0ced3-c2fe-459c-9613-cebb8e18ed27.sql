-- 1. Somente advogados podem criar/editar/excluir processos, movimentações e anexos
DROP POLICY IF EXISTS processos_insert ON public.processos;
DROP POLICY IF EXISTS processos_update ON public.processos;
CREATE POLICY processos_insert ON public.processos FOR INSERT TO authenticated WITH CHECK (public.is_advogado());
CREATE POLICY processos_update ON public.processos FOR UPDATE TO authenticated USING (public.is_advogado()) WITH CHECK (public.is_advogado());

DROP POLICY IF EXISTS mov_insert ON public.movimentacoes;
DROP POLICY IF EXISTS mov_update ON public.movimentacoes;
CREATE POLICY mov_insert ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (public.is_advogado());
CREATE POLICY mov_update ON public.movimentacoes FOR UPDATE TO authenticated USING (public.is_advogado()) WITH CHECK (public.is_advogado());

DROP POLICY IF EXISTS anexos_insert ON public.anexos;
CREATE POLICY anexos_insert ON public.anexos FOR INSERT TO authenticated WITH CHECK (public.is_advogado());

DROP POLICY IF EXISTS pc_insert ON public.processo_clientes;
DROP POLICY IF EXISTS pc_delete ON public.processo_clientes;
CREATE POLICY pc_insert ON public.processo_clientes FOR INSERT TO authenticated WITH CHECK (public.is_advogado());
CREATE POLICY pc_delete ON public.processo_clientes FOR DELETE TO authenticated USING (public.is_advogado());

DROP POLICY IF EXISTS pa_insert ON public.processo_advogados;
DROP POLICY IF EXISTS pa_delete ON public.processo_advogados;
CREATE POLICY pa_insert ON public.processo_advogados FOR INSERT TO authenticated WITH CHECK (public.is_advogado());
CREATE POLICY pa_delete ON public.processo_advogados FOR DELETE TO authenticated USING (public.is_advogado());

-- 2. Histórico completo de alterações do processo (campos e anexos)
CREATE TABLE public.processo_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  entidade text NOT NULL,
  acao text NOT NULL,
  campo text,
  valor_anterior text,
  valor_novo text,
  alterado_por_id uuid REFERENCES public.profiles(id),
  alterado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.processo_historico TO authenticated;
GRANT ALL ON public.processo_historico TO service_role;
ALTER TABLE public.processo_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY proc_hist_select ON public.processo_historico FOR SELECT TO authenticated USING (true);

CREATE INDEX processo_historico_processo_idx ON public.processo_historico (processo_id, alterado_em DESC);

CREATE OR REPLACE FUNCTION public.registrar_historico_processo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _autor uuid := public.current_profile_id();
  _campos text[] := ARRAY['tipo','acao','vara','fase','instancia','data_inicial','data_final','concluido','vencido','valor_causa','proximo_prazo','descricao'];
  _campo text;
  _antes text;
  _depois text;
  _old jsonb := to_jsonb(OLD);
  _new jsonb := to_jsonb(NEW);
BEGIN
  FOREACH _campo IN ARRAY _campos LOOP
    _antes := _old ->> _campo;
    _depois := _new ->> _campo;
    IF _antes IS DISTINCT FROM _depois THEN
      INSERT INTO public.processo_historico (processo_id, entidade, acao, campo, valor_anterior, valor_novo, alterado_por_id)
      VALUES (NEW.id, 'processo', 'editado', _campo, _antes, _depois, _autor);
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.registrar_historico_processo() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER processos_historico
AFTER UPDATE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_processo();

CREATE OR REPLACE FUNCTION public.registrar_historico_anexo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _autor uuid := public.current_profile_id();
  _processo uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _processo := COALESCE(NEW.processo_id, (SELECT processo_id FROM public.movimentacoes WHERE id = NEW.movimentacao_id));
    INSERT INTO public.processo_historico (processo_id, entidade, acao, campo, valor_anterior, valor_novo, alterado_por_id)
    VALUES (_processo, 'anexo', 'adicionado', 'arquivo', NULL, NEW.nome, COALESCE(NEW.autor_id, _autor));
    RETURN NEW;
  ELSE
    _processo := COALESCE(OLD.processo_id, (SELECT processo_id FROM public.movimentacoes WHERE id = OLD.movimentacao_id));
    INSERT INTO public.processo_historico (processo_id, entidade, acao, campo, valor_anterior, valor_novo, alterado_por_id)
    VALUES (_processo, 'anexo', 'removido', 'arquivo', OLD.nome, NULL, _autor);
    RETURN OLD;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.registrar_historico_anexo() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER anexos_historico
AFTER INSERT OR DELETE ON public.anexos
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_anexo();