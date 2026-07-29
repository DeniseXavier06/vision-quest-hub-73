GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO anon, authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
CREATE POLICY "Anon can view avaliacoes" ON public.avaliacoes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert avaliacoes" ON public.avaliacoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update avaliacoes" ON public.avaliacoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete avaliacoes" ON public.avaliacoes FOR DELETE TO anon USING (true);
DROP TRIGGER IF EXISTS update_avaliacoes_updated_at ON public.avaliacoes;
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();