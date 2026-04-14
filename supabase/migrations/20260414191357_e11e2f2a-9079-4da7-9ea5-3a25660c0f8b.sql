
CREATE TABLE public.cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semestre_id UUID NOT NULL REFERENCES public.semestres_letivos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_cursos" ON public.cursos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_cursos" ON public.cursos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_turmas" ON public.turmas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_turmas" ON public.turmas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.disciplinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  carga_horaria INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_disciplinas" ON public.disciplinas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_disciplinas" ON public.disciplinas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
