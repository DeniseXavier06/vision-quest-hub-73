
CREATE TABLE public.importacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo TEXT NOT NULL,
  perfil TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  total_registros INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view importacoes" ON public.importacoes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert importacoes" ON public.importacoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update importacoes" ON public.importacoes FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete importacoes" ON public.importacoes FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view importacoes" ON public.importacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert importacoes" ON public.importacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update importacoes" ON public.importacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete importacoes" ON public.importacoes FOR DELETE TO authenticated USING (true);

CREATE TABLE public.resultados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  importacao_id UUID REFERENCES public.importacoes(id) ON DELETE CASCADE,
  semestre TEXT NOT NULL DEFAULT '',
  nivel TEXT NOT NULL DEFAULT '',
  curso TEXT NOT NULL DEFAULT '',
  dimensao TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  texto_questao TEXT NOT NULL DEFAULT '',
  excelente INTEGER NOT NULL DEFAULT 0,
  bom INTEGER NOT NULL DEFAULT 0,
  atende_parcialmente INTEGER NOT NULL DEFAULT 0,
  regular INTEGER NOT NULL DEFAULT 0,
  muito_ruim INTEGER NOT NULL DEFAULT 0,
  nao_se_aplica INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  media NUMERIC(5,2) NOT NULL DEFAULT 0,
  conceito TEXT NOT NULL DEFAULT '',
  tipo_avaliacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view resultados" ON public.resultados FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert resultados" ON public.resultados FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete resultados" ON public.resultados FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view resultados" ON public.resultados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert resultados" ON public.resultados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can delete resultados" ON public.resultados FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_resultados_importacao ON public.resultados(importacao_id);
CREATE INDEX idx_resultados_semestre ON public.resultados(semestre);
CREATE INDEX idx_resultados_tipo ON public.resultados(tipo_avaliacao);
