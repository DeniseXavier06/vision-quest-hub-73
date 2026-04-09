
-- Enum types
CREATE TYPE public.tipo_setor AS ENUM ('departamento', 'coordenacao', 'setor');
CREATE TYPE public.tipo_usuario AS ENUM ('coordenador', 'gestor', 'admin_cpa');
CREATE TYPE public.status_acao AS ENUM ('nao_iniciada', 'em_andamento', 'concluida');
CREATE TYPE public.status_avaliacao AS ENUM ('planejado', 'em_execucao', 'concluido');
CREATE TYPE public.status_reuniao AS ENUM ('agendada', 'realizada', 'cancelada');

-- Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Setores
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  tipo tipo_setor NOT NULL DEFAULT 'departamento',
  descricao TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update setores" ON public.setores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Usuarios CPA
CREATE TABLE public.usuarios_cpa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT DEFAULT '',
  departamento TEXT DEFAULT '',
  tipo_usuario tipo_usuario NOT NULL DEFAULT 'coordenador',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios_cpa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view usuarios" ON public.usuarios_cpa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert usuarios" ON public.usuarios_cpa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update usuarios" ON public.usuarios_cpa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete usuarios" ON public.usuarios_cpa FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_usuarios_cpa_updated_at BEFORE UPDATE ON public.usuarios_cpa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Acoes
CREATE TABLE public.acoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  eixo TEXT NOT NULL,
  meta TEXT DEFAULT '',
  responsavel TEXT NOT NULL,
  status status_acao NOT NULL DEFAULT 'nao_iniciada',
  percentual_progresso INTEGER NOT NULL DEFAULT 0 CHECK (percentual_progresso >= 0 AND percentual_progresso <= 100),
  prazo DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view acoes" ON public.acoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert acoes" ON public.acoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update acoes" ON public.acoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete acoes" ON public.acoes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_acoes_updated_at BEFORE UPDATE ON public.acoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reunioes
CREATE TABLE public.reunioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo TEXT NOT NULL,
  status status_reuniao NOT NULL DEFAULT 'agendada',
  local TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reunioes" ON public.reunioes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reunioes" ON public.reunioes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reunioes" ON public.reunioes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reunioes" ON public.reunioes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_reunioes_updated_at BEFORE UPDATE ON public.reunioes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Avaliacoes (Cronograma)
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status status_avaliacao NOT NULL DEFAULT 'planejado',
  responsavel TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert avaliacoes" ON public.avaliacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update avaliacoes" ON public.avaliacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete avaliacoes" ON public.avaliacoes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
