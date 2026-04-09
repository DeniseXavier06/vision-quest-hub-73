
-- Create table for saved reports
CREATE TABLE public.relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  tabela_origem TEXT NOT NULL,
  campos_selecionados JSONB NOT NULL DEFAULT '[]'::jsonb,
  tipo_grafico TEXT NOT NULL DEFAULT 'bar',
  filtros JSONB DEFAULT '{}'::jsonb,
  configuracao JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since no auth yet)
CREATE POLICY "Anon can view relatorios" ON public.relatorios FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert relatorios" ON public.relatorios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update relatorios" ON public.relatorios FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete relatorios" ON public.relatorios FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view relatorios" ON public.relatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert relatorios" ON public.relatorios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update relatorios" ON public.relatorios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete relatorios" ON public.relatorios FOR DELETE TO authenticated USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_relatorios_updated_at
  BEFORE UPDATE ON public.relatorios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
