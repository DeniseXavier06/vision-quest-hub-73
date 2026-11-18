CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND aprovado))
$$;

DO $$
DECLARE r record; t text;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND (qual='true' OR with_check='true') LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['acoes','ambiente_dimensoes','ambiente_perfis','ambientes_avaliacao','areas_avaliacao','avaliacoes','avaliadores_sessao','cursos','dimensoes_avaliacao','disciplinas','importacoes','mapeamentos_campos','periodos','questoes_avaliacao','relatorios','respostas_avaliacao','resultados','reunioes','semestres_letivos','setores','sugestoes','turmas','usuarios_cpa'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS staff_all ON public.%I', t);
    EXECUTE format('CREATE POLICY staff_all ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS staff_select_analises ON public.analises;
CREATE POLICY staff_select_analises ON public.analises FOR SELECT TO authenticated USING (public.is_staff());

-- Public read for evaluation form and home page
CREATE POLICY public_read_ambientes ON public.ambientes_avaliacao FOR SELECT TO anon USING (ativo);
CREATE POLICY public_read_amb_dim ON public.ambiente_dimensoes FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.ambientes_avaliacao a WHERE a.id = ambiente_id AND a.ativo));
CREATE POLICY public_read_amb_perfis ON public.ambiente_perfis FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.ambientes_avaliacao a WHERE a.id = ambiente_id AND a.ativo));
CREATE POLICY public_read_dimensoes ON public.dimensoes_avaliacao FOR SELECT TO anon USING (ativo);
CREATE POLICY public_read_areas ON public.areas_avaliacao FOR SELECT TO anon USING (ativo);
CREATE POLICY public_read_questoes ON public.questoes_avaliacao FOR SELECT TO anon USING (ativo);
CREATE POLICY public_read_avaliacoes_home ON public.avaliacoes FOR SELECT TO anon USING (exibir_home);

CREATE OR REPLACE FUNCTION public.avaliacao_login(p_ambiente uuid, p_matricula text, p_senha text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.avaliadores_sessao;
BEGIN
  SELECT * INTO s FROM public.avaliadores_sessao WHERE ambiente_id = p_ambiente AND matricula = trim(p_matricula) LIMIT 1;
  IF s.id IS NULL OR regexp_replace(coalesce(s.cpf,''),'[\s.\-]','','g') <> regexp_replace(coalesce(p_senha,''),'[\s.\-]','','g') THEN
    RETURN jsonb_build_object('erro','credenciais');
  END IF;
  IF s.completado THEN RETURN jsonb_build_object('erro','completado'); END IF;
  RETURN jsonb_build_object('token', s.token, 'nome', s.nome, 'curso', s.curso, 'perfil', s.perfil);
END $$;

CREATE OR REPLACE FUNCTION public.avaliacao_enviar(p_token uuid, p_respostas jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.avaliadores_sessao;
BEGIN
  SELECT * INTO s FROM public.avaliadores_sessao WHERE token = p_token FOR UPDATE;
  IF s.id IS NULL OR s.completado THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF jsonb_typeof(p_respostas) <> 'array' OR jsonb_array_length(p_respostas) = 0 THEN RAISE EXCEPTION 'Sem respostas'; END IF;
  INSERT INTO public.respostas_avaliacao(sessao_id, ambiente_id, dimensao_id, questao_id, nota, observacao)
  SELECT s.id, s.ambiente_id, q.dimensao_id, q.id, x.nota, left(coalesce(x.observacao,''), 2000)
  FROM jsonb_to_recordset(p_respostas) AS x(questao_id uuid, nota integer, observacao text)
  JOIN public.questoes_avaliacao q ON q.id = x.questao_id
  WHERE x.nota BETWEEN 0 AND 5;
  UPDATE public.avaliadores_sessao SET completado = true WHERE id = s.id;
END $$;

GRANT EXECUTE ON FUNCTION public.avaliacao_login(uuid,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.avaliacao_enviar(uuid,jsonb) TO anon, authenticated;