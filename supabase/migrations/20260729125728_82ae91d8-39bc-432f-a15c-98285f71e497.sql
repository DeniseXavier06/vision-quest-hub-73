ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS exibir_home boolean NOT NULL DEFAULT false;
GRANT SELECT ON public.avaliacoes TO anon;