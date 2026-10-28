ALTER TABLE public.importacoes ADD COLUMN tipo text NOT NULL DEFAULT 'avaliacoes' CONSTRAINT importacoes_tipo_valid CHECK (tipo IN ('avaliacoes', 'sugestoes'));
ALTER TABLE public.importacoes ADD COLUMN ambiente_id uuid REFERENCES public.ambientes_avaliacao(id);
CREATE TABLE public.sugestoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 importacao_id uuid NOT NULL REFERENCES public.importacoes(id) ON DELETE CASCADE,
 ambiente_id uuid NOT NULL REFERENCES public.ambientes_avaliacao(id),
 perfil public.perfil_avaliacao NOT NULL,
 nome_curso text NOT NULL DEFAULT '', nivel text NOT NULL DEFAULT '', dimensao text NOT NULL DEFAULT '', area text NOT NULL DEFAULT '',
 codigo_turma text NOT NULL DEFAULT '', codigo_prova text NOT NULL DEFAULT '', nome_prova text NOT NULL DEFAULT '', codigo_questao text NOT NULL DEFAULT '', texto_questao text NOT NULL DEFAULT '',
 disciplina_avaliada text NOT NULL DEFAULT '', professor_avaliado text NOT NULL DEFAULT '', coordenador_avaliado text NOT NULL DEFAULT '',
 sugestao text NOT NULL CHECK (length(trim(sugestao)) > 0), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sugestoes TO authenticated;
GRANT ALL ON public.sugestoes TO service_role;
ALTER TABLE public.sugestoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sugestoes_approved ON public.sugestoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND aprovado)) WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND aprovado));
CREATE INDEX sugestoes_importacao_idx ON public.sugestoes(importacao_id);
CREATE INDEX sugestoes_ambiente_perfil_idx ON public.sugestoes(ambiente_id, perfil);
CREATE OR REPLACE FUNCTION public.importar_sugestoes(p_ambiente uuid, p_perfil public.perfil_avaliacao, p_arquivo text, p_linhas jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_id uuid; v_periodo text; v_total integer;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND aprovado)) THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) = 0 THEN RAISE EXCEPTION 'Arquivo sem sugestões'; END IF;
 IF length(trim(p_arquivo)) = 0 THEN RAISE EXCEPTION 'Nome do arquivo obrigatório'; END IF;
 SELECT s.nome INTO v_periodo FROM public.ambientes_avaliacao a JOIN public.semestres_letivos s ON s.id = a.semestre_id WHERE a.id = p_ambiente;
 IF v_periodo IS NULL THEN RAISE EXCEPTION 'Ambiente não encontrado'; END IF;
 v_total := jsonb_array_length(p_linhas);
 INSERT INTO public.importacoes(nome_arquivo, perfil, periodo, total_registros, tipo, ambiente_id) VALUES (p_arquivo, p_perfil::text, v_periodo, v_total, 'sugestoes', p_ambiente) RETURNING id INTO v_id;
 INSERT INTO public.sugestoes(importacao_id, ambiente_id, perfil, nome_curso, nivel, dimensao, area, codigo_turma, codigo_prova, nome_prova, codigo_questao, texto_questao, disciplina_avaliada, professor_avaliado, coordenador_avaliado, sugestao)
 SELECT v_id, p_ambiente, p_perfil, coalesce(x.nome_curso,''), coalesce(x.nivel,''), coalesce(x.dimensao,''), coalesce(x.area,''), coalesce(x.codigo_turma,''), coalesce(x.codigo_prova,''), coalesce(x.nome_prova,''), coalesce(x.codigo_questao,''), coalesce(x.texto_questao,''), coalesce(x.disciplina_avaliada,''), coalesce(x.professor_avaliado,''), coalesce(x.coordenador_avaliado,''), x.sugestao
 FROM jsonb_to_recordset(p_linhas) AS x(nome_curso text, nivel text, dimensao text, area text, codigo_turma text, codigo_prova text, nome_prova text, codigo_questao text, texto_questao text, disciplina_avaliada text, professor_avaliado text, coordenador_avaliado text, sugestao text);
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.importar_sugestoes(uuid, public.perfil_avaliacao, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_sugestoes(uuid, public.perfil_avaliacao, text, jsonb) TO authenticated, service_role;