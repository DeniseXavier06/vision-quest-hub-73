
CREATE POLICY "Anon can view reunioes" ON public.reunioes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert reunioes" ON public.reunioes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update reunioes" ON public.reunioes FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete reunioes" ON public.reunioes FOR DELETE TO anon USING (true);
