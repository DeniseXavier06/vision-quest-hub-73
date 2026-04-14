
-- Enum para nível
CREATE TYPE public.nivel_avaliacao AS ENUM ('presencial', 'ead');

-- Enum para perfis
CREATE TYPE public.perfil_avaliacao AS ENUM ('professor', 'aluno', 'colaborador', 'coordenador');

-- Semestres letivos
CREATE TABLE public.semestres_letivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, -- ex: 2026.1, 2026.2
  ano INTEGER NOT NULL,
  periodo INTEGER NOT NULL, -- 1 ou 2
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.semestres_letivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_semestres" ON public.semestres_letivos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_semestres" ON public.semestres_letivos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_semestres" ON public.semestres_letivos FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_semestres" ON public.semestres_letivos FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_semestres" ON public.semestres_letivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_semestres" ON public.semestres_letivos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_semestres" ON public.semestres_letivos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_semestres" ON public.semestres_letivos FOR DELETE TO authenticated USING (true);

-- Dimensões de avaliação
CREATE TABLE public.dimensoes_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dimensoes_avaliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_dimensoes" ON public.dimensoes_avaliacao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_dimensoes" ON public.dimensoes_avaliacao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_dimensoes" ON public.dimensoes_avaliacao FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_dimensoes" ON public.dimensoes_avaliacao FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_dimensoes" ON public.dimensoes_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_dimensoes" ON public.dimensoes_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_dimensoes" ON public.dimensoes_avaliacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_dimensoes" ON public.dimensoes_avaliacao FOR DELETE TO authenticated USING (true);

-- Questões por dimensão
CREATE TABLE public.questoes_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dimensao_id UUID NOT NULL REFERENCES public.dimensoes_avaliacao(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questoes_avaliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_questoes" ON public.questoes_avaliacao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_questoes" ON public.questoes_avaliacao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_questoes" ON public.questoes_avaliacao FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_questoes" ON public.questoes_avaliacao FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_questoes" ON public.questoes_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_questoes" ON public.questoes_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_questoes" ON public.questoes_avaliacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_questoes" ON public.questoes_avaliacao FOR DELETE TO authenticated USING (true);

-- Ambientes de avaliação
CREATE TABLE public.ambientes_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semestre_id UUID NOT NULL REFERENCES public.semestres_letivos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nivel nivel_avaliacao NOT NULL DEFAULT 'presencial',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  prorrogado_ate DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ambientes_avaliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_ambientes" ON public.ambientes_avaliacao FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_ambientes" ON public.ambientes_avaliacao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_ambientes" ON public.ambientes_avaliacao FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_ambientes" ON public.ambientes_avaliacao FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_ambientes" ON public.ambientes_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_ambientes" ON public.ambientes_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_ambientes" ON public.ambientes_avaliacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_ambientes" ON public.ambientes_avaliacao FOR DELETE TO authenticated USING (true);

-- Perfis vinculados ao ambiente
CREATE TABLE public.ambiente_perfis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambiente_id UUID NOT NULL REFERENCES public.ambientes_avaliacao(id) ON DELETE CASCADE,
  perfil perfil_avaliacao NOT NULL,
  UNIQUE(ambiente_id, perfil)
);
ALTER TABLE public.ambiente_perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_amb_perfis" ON public.ambiente_perfis FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_amb_perfis" ON public.ambiente_perfis FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_amb_perfis" ON public.ambiente_perfis FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_amb_perfis" ON public.ambiente_perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_amb_perfis" ON public.ambiente_perfis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_amb_perfis" ON public.ambiente_perfis FOR DELETE TO authenticated USING (true);

-- Dimensões vinculadas ao ambiente
CREATE TABLE public.ambiente_dimensoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambiente_id UUID NOT NULL REFERENCES public.ambientes_avaliacao(id) ON DELETE CASCADE,
  dimensao_id UUID NOT NULL REFERENCES public.dimensoes_avaliacao(id) ON DELETE CASCADE,
  UNIQUE(ambiente_id, dimensao_id)
);
ALTER TABLE public.ambiente_dimensoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_amb_dim" ON public.ambiente_dimensoes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_amb_dim" ON public.ambiente_dimensoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_amb_dim" ON public.ambiente_dimensoes FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_amb_dim" ON public.ambiente_dimensoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_amb_dim" ON public.ambiente_dimensoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_amb_dim" ON public.ambiente_dimensoes FOR DELETE TO authenticated USING (true);

-- Mapeamento de campos para importação
CREATE TABLE public.mapeamentos_campos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambiente_id UUID NOT NULL REFERENCES public.ambientes_avaliacao(id) ON DELETE CASCADE,
  perfil perfil_avaliacao NOT NULL,
  campo_sistema TEXT NOT NULL, -- ex: matricula, nome, curso, periodo, disciplinas, setor
  campo_arquivo TEXT NOT NULL, -- coluna do Excel
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mapeamentos_campos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_mapeamentos" ON public.mapeamentos_campos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_mapeamentos" ON public.mapeamentos_campos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_mapeamentos" ON public.mapeamentos_campos FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_mapeamentos" ON public.mapeamentos_campos FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_mapeamentos" ON public.mapeamentos_campos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_mapeamentos" ON public.mapeamentos_campos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_mapeamentos" ON public.mapeamentos_campos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_mapeamentos" ON public.mapeamentos_campos FOR DELETE TO authenticated USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_semestres_updated_at BEFORE UPDATE ON public.semestres_letivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dimensoes_updated_at BEFORE UPDATE ON public.dimensoes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questoes_updated_at BEFORE UPDATE ON public.questoes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ambientes_updated_at BEFORE UPDATE ON public.ambientes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
