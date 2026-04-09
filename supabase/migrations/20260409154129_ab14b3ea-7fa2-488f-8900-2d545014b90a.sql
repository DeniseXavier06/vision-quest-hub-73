
CREATE POLICY "Anon can view acoes" ON public.acoes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert acoes" ON public.acoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update acoes" ON public.acoes FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete acoes" ON public.acoes FOR DELETE TO anon USING (true);
