CREATE POLICY "Anon can update resultados"
ON public.resultados
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Auth can update resultados"
ON public.resultados
FOR UPDATE
TO authenticated
USING (true);