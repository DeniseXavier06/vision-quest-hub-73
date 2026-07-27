UPDATE public.resultados r
SET semestre = i.periodo
FROM public.importacoes i
WHERE r.importacao_id = i.id AND coalesce(trim(r.semestre),'') = '' AND coalesce(trim(i.periodo),'') <> '';

UPDATE public.resultados SET nivel = tipo_avaliacao WHERE coalesce(trim(nivel),'') = '';

DELETE FROM public.importacoes WHERE periodo = 'TESTE' AND nome_arquivo = 'teste.xlsx';