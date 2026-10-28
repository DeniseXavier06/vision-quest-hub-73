CREATE OR REPLACE FUNCTION public.resultados_discentes_agregados(anos text[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_array(semestre, nivel, curso, dimensao, area, texto_questao, professor,
    excelente, bom, atende_parcialmente, regular, muito_ruim, nao_se_aplica, total, soma_media, n)), '[]'::jsonb)
  FROM (
    SELECT r.semestre, r.nivel, r.curso, r.dimensao, r.area, r.texto_questao, coalesce(r.professor, '') AS professor,
      sum(coalesce(r.excelente,0)) excelente, sum(coalesce(r.bom,0)) bom, sum(coalesce(r.atende_parcialmente,0)) atende_parcialmente,
      sum(coalesce(r.regular,0)) regular, sum(coalesce(r.muito_ruim,0)) muito_ruim, sum(coalesce(r.nao_se_aplica,0)) nao_se_aplica,
      sum(coalesce(r.total,0)) total, sum(coalesce(r.media,0)) soma_media, count(*) n
    FROM public.resultados r
    WHERE left(trim(r.semestre), 4) = ANY(anos)
      AND (r.nivel ILIKE '%aluno%' OR r.nivel ILIKE '%discente%')
    GROUP BY 1,2,3,4,5,6,7
  ) g;
$$;
GRANT EXECUTE ON FUNCTION public.resultados_discentes_agregados(text[]) TO anon, authenticated, service_role;