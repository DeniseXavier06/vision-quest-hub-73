CREATE OR REPLACE FUNCTION public.resultados_perfil_agregados(perfil text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_array(semestre, nivel, curso, dimensao, area, texto_questao, professor, disciplina,
    excelente, bom, atende_parcialmente, regular, muito_ruim, nao_se_aplica, total, soma_media, n)), '[]'::jsonb)
  FROM (
    SELECT r.semestre, r.nivel, r.curso, r.dimensao, r.area, r.texto_questao, coalesce(r.professor,'') professor, coalesce(r.disciplina,'') disciplina,
      sum(coalesce(r.excelente,0)) excelente, sum(coalesce(r.bom,0)) bom, sum(coalesce(r.atende_parcialmente,0)) atende_parcialmente,
      sum(coalesce(r.regular,0)) regular, sum(coalesce(r.muito_ruim,0)) muito_ruim, sum(coalesce(r.nao_se_aplica,0)) nao_se_aplica,
      sum(coalesce(r.total,0)) total, sum(coalesce(r.media,0)) soma_media, count(*) n
    FROM public.resultados r
    WHERE CASE WHEN perfil = 'discentes' THEN (r.nivel ILIKE '%aluno%' OR r.nivel ILIKE '%discente%') ELSE r.nivel ILIKE '%professor%' END
    GROUP BY 1,2,3,4,5,6,7,8
  ) g;
$$;
GRANT EXECUTE ON FUNCTION public.resultados_perfil_agregados(text) TO authenticated;