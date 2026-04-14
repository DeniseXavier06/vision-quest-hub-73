
-- Tabela de sessões de avaliadores
CREATE TABLE public.avaliadores_sessao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambiente_id UUID NOT NULL REFERENCES public.ambientes_avaliacao(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL,
  nome TEXT NOT NULL,
  curso TEXT NOT NULL DEFAULT '',
  perfil TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  completado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ambiente_id, matricula)
);

ALTER TABLE public.avaliadores_sessao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_sessao" ON public.avaliadores_sessao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_sessao" ON public.avaliadores_sessao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_sessao" ON public.avaliadores_sessao FOR UPDATE TO anon USING (true);
CREATE POLICY "auth_select_sessao" ON public.avaliadores_sessao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sessao" ON public.avaliadores_sessao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sessao" ON public.avaliadores_sessao FOR UPDATE TO authenticated USING (true);

-- Tabela de respostas
CREATE TABLE public.respostas_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id UUID NOT NULL REFERENCES public.avaliadores_sessao(id) ON DELETE CASCADE,
  ambiente_id UUID NOT NULL REFERENCES public.ambientes_avaliacao(id) ON DELETE CASCADE,
  dimensao_id UUID NOT NULL REFERENCES public.dimensoes_avaliacao(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.questoes_avaliacao(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  observacao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sessao_id, questao_id)
);

ALTER TABLE public.respostas_avaliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_respostas" ON public.respostas_avaliacao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_respostas" ON public.respostas_avaliacao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_select_respostas" ON public.respostas_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_respostas" ON public.respostas_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_respostas" ON public.respostas_avaliacao FOR DELETE TO authenticated USING (true);
