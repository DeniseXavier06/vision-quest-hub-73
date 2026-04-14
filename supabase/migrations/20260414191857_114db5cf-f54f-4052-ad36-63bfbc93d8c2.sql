
CREATE TABLE public.periodos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL DEFAULT 1,
  nome TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_periodos" ON public.periodos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_periodos" ON public.periodos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_periodos_updated_at BEFORE UPDATE ON public.periodos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add periodo_id to turmas, drop curso_id
ALTER TABLE public.turmas ADD COLUMN periodo_id UUID REFERENCES public.periodos(id) ON DELETE CASCADE;
ALTER TABLE public.turmas ALTER COLUMN curso_id DROP NOT NULL;
