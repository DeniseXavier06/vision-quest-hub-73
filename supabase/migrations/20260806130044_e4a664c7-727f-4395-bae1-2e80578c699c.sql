CREATE TABLE public.analises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  nome TEXT NOT NULL,
  descricao TEXT,
  workbook JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analises TO authenticated;
GRANT ALL ON public.analises TO service_role;
ALTER TABLE public.analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados veem todas as analises" ON public.analises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios criam suas analises" ON public.analises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editam suas analises" ON public.analises FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios excluem suas analises" ON public.analises FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_analises_updated_at BEFORE UPDATE ON public.analises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();