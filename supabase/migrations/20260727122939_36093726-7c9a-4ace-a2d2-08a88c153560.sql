GRANT SELECT, INSERT, UPDATE, DELETE ON public.importacoes TO anon, authenticated;
GRANT ALL ON public.importacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados TO anon, authenticated;
GRANT ALL ON public.resultados TO service_role;