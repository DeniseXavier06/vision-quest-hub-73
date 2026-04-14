
CREATE TABLE public.areas_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dimensao_id UUID NOT NULL REFERENCES public.dimensoes_avaliacao(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.areas_avaliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_areas" ON public.areas_avaliacao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_areas" ON public.areas_avaliacao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_areas" ON public.areas_avaliacao FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_areas" ON public.areas_avaliacao FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_areas" ON public.areas_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_areas" ON public.areas_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_areas" ON public.areas_avaliacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_areas" ON public.areas_avaliacao FOR DELETE TO authenticated USING (true);

-- Add area_id to questoes_avaliacao (nullable for backward compat)
ALTER TABLE public.questoes_avaliacao ADD COLUMN area_id UUID REFERENCES public.areas_avaliacao(id) ON DELETE CASCADE;

CREATE TRIGGER update_areas_avaliacao_updated_at
BEFORE UPDATE ON public.areas_avaliacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
