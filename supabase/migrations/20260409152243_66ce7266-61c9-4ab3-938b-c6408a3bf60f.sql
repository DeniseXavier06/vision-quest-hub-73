
CREATE POLICY "Anon can view setores" ON public.setores FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert setores" ON public.setores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update setores" ON public.setores FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete setores" ON public.setores FOR DELETE TO anon USING (true);

CREATE POLICY "Anon can view usuarios_cpa" ON public.usuarios_cpa FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert usuarios_cpa" ON public.usuarios_cpa FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update usuarios_cpa" ON public.usuarios_cpa FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete usuarios_cpa" ON public.usuarios_cpa FOR DELETE TO anon USING (true);
