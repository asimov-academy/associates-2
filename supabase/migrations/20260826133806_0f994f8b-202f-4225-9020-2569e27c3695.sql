CREATE TABLE public.movimentacao_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id uuid NOT NULL REFERENCES public.movimentacoes(id) ON DELETE CASCADE,
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  data_anterior date,
  data_nova date,
  descricao_anterior text,
  descricao_nova text,
  alterado_por_id uuid REFERENCES public.profiles(id),
  alterado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.movimentacao_historico TO authenticated;
GRANT ALL ON public.movimentacao_historico TO service_role;

ALTER TABLE public.movimentacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hist_select" ON public.movimentacao_historico
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_mov_hist_mov ON public.movimentacao_historico(movimentacao_id);

CREATE OR REPLACE FUNCTION public.registrar_historico_movimentacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.descricao IS DISTINCT FROM OLD.descricao OR NEW.data IS DISTINCT FROM OLD.data THEN
    INSERT INTO public.movimentacao_historico (
      movimentacao_id, processo_id, data_anterior, data_nova,
      descricao_anterior, descricao_nova, alterado_por_id, alterado_em
    ) VALUES (
      OLD.id, OLD.processo_id, OLD.data, NEW.data,
      OLD.descricao, NEW.descricao,
      COALESCE(NEW.alterado_por_id, public.current_profile_id()), now()
    );
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.registrar_historico_movimentacao() FROM anon, authenticated;

CREATE TRIGGER movimentacoes_historico
AFTER UPDATE ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_movimentacao();