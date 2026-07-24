import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Compass,
  Rocket,
  CheckCircle2,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Fase = 'planejamento' | 'desenvolvimento' | 'consolidacao';

const FASE_KEY = 'cpa2026-fase-atual';

const fases: {
  id: Fase;
  numero: string;
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
  etapas: { titulo: string; itens: string[] }[];
}[] = [
  {
    id: 'planejamento',
    numero: 'Fase 1',
    titulo: 'Planejamento',
    descricao: 'Definição do público, preparação e testes.',
    icon: Compass,
    cor: 'from-info/20 to-info/5 border-info/30',
    etapas: [
      {
        titulo: 'Definição do público',
        itens: [
          'Cursos participantes',
          'Turmas vinculadas',
          'Coordenadores responsáveis',
          'Público-alvo da avaliação',
          'Quantitativo de alunos por curso e turma',
          'Canais de comunicação',
          'Necessidades específicas de cada curso',
        ],
      },
      {
        titulo: 'Elaboração e preparação',
        itens: [
          'Definição do tema da campanha',
          'Criação das artes',
          'Organização do cronograma',
          'Preparação dos links de acesso',
          'Cadastro dos coordenadores',
          'Configuração das mensagens de WhatsApp',
          'Reserva do laboratório do terceiro andar',
          'Organização dos relatórios',
          'Preparação dos materiais para divulgação',
        ],
      },
      {
        titulo: 'Testes',
        itens: [
          'Testar login dos coordenadores',
          'Testar acesso ao painel',
          'Testar os filtros de curso e turma',
          'Importar um relatório de teste',
          'Conferir os quantitativos',
          'Testar o envio de uma mensagem',
          'Confirmar os links de acesso',
          'Validar os números de WhatsApp',
          'Conferir as permissões dos usuários',
        ],
      },
    ],
  },
  {
    id: 'desenvolvimento',
    numero: 'Fase 2',
    titulo: 'Desenvolvimento',
    descricao: 'Sensibilização, execução e acompanhamento.',
    icon: Rocket,
    cor: 'from-primary/20 to-primary/5 border-primary/30',
    etapas: [
      {
        titulo: 'Sensibilização e execução',
        itens: [
          'Divulgação da campanha',
          'Comunicação do tema',
          'Lembretes aos coordenadores',
          'Acompanhamento diário dos cursos e turmas',
          'Envio de informações pelo WhatsApp',
          'Atualização dos relatórios',
          'Identificação das turmas com baixa participação',
          'Orientação aos coordenadores',
          'Divulgação do laboratório de apoio',
          'Registro de ocorrências e dúvidas',
        ],
      },
    ],
  },
  {
    id: 'consolidacao',
    numero: 'Fase 3',
    titulo: 'Consolidação',
    descricao: 'Análise, discussão e divulgação dos resultados.',
    icon: CheckCircle2,
    cor: 'from-success/20 to-success/5 border-success/30',
    etapas: [
      {
        titulo: 'Análise',
        itens: [
          'Consolidar os dados finais',
          'Comparar cursos e turmas',
          'Identificar avanços e pontos de atenção',
          'Verificar a participação geral',
          'Gerar relatórios consolidados',
          'Registrar observações da CPA',
        ],
      },
      {
        titulo: 'Discussão e divulgação dos resultados',
        itens: [
          'Apresentar os resultados aos coordenadores',
          'Promover a discussão dos dados',
          'Divulgar os resultados institucionais',
          'Registrar encaminhamentos',
          'Criar plano de melhorias',
          'Arquivar a campanha de 2026',
          'Preparar informações para a próxima avaliação',
        ],
      },
    ],
  },
];

const cronograma = [
  { data: '22/07/2026', atividade: 'Abertura do chamado para criação das artes', responsavel: 'CPA / setor responsável', status: 'A acompanhar' },
  { data: '22/07/2026', atividade: 'Solicitação ao Danilo sobre os relatórios 2026.2', responsavel: 'CPA / Danilo', status: 'E-mail enviado' },
  { data: '01/08/2026', atividade: 'Início da divulgação da campanha', responsavel: 'CPA / comunicação', status: 'Programado' },
  { data: '24/08/2026', atividade: 'Abertura da Avaliação Institucional', responsavel: 'CPA', status: 'Programado' },
  { data: '14/09/2026', atividade: 'Apoio no laboratório do terceiro andar', responsavel: 'Edemilton / CPA', status: 'A confirmar' },
  { data: '15/09/2026', atividade: 'Apoio no laboratório do terceiro andar', responsavel: 'Edemilton / CPA', status: 'A confirmar' },
  { data: '16/09/2026', atividade: 'Apoio no laboratório do terceiro andar', responsavel: 'Edemilton / CPA', status: 'A confirmar' },
  { data: '18/09/2026', atividade: 'Encerramento da avaliação', responsavel: 'CPA', status: 'Programado' },
  { data: 'Após 18/09', atividade: 'Análise e consolidação dos resultados', responsavel: 'CPA', status: 'A definir' },
  { data: 'Após a análise', atividade: 'Discussão e divulgação dos resultados', responsavel: 'CPA / coordenações', status: 'A definir' },
];

const statusVariant = (s: string): 'default' | 'secondary' | 'outline' => {
  if (s === 'Programado' || s === 'E-mail enviado') return 'default';
  if (s === 'A confirmar' || s === 'A acompanhar') return 'secondary';
  return 'outline';
};

const Landing = () => {
  const [faseAtual, setFaseAtual] = useState<Fase>('planejamento');

  useEffect(() => {
    const stored = localStorage.getItem(FASE_KEY) as Fase | null;
    if (stored) setFaseAtual(stored);
  }, []);

  const alterarFase = (f: Fase) => {
    setFaseAtual(f);
    localStorage.setItem(FASE_KEY, f);
  };

  const faseObj = fases.find((f) => f.id === faseAtual)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-heading font-bold text-foreground leading-tight">
                Painel de Acompanhamento
              </h1>
              <p className="text-xs text-muted-foreground">CPA 2026 — UniRios</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="#apresentacao" className="px-3 py-2 hover:text-primary transition-colors">Apresentação</a>
            <a href="#metodologia" className="px-3 py-2 hover:text-primary transition-colors">Metodologia</a>
            <a href="#cronograma" className="px-3 py-2 hover:text-primary transition-colors">Cronograma</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/painel"><FileBarChart className="w-4 h-4 mr-1.5" />Portal de Relatórios</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/painel">Acessar acompanhamento<ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="apresentacao" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 relative">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Fase atual: {faseObj.titulo}
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-heading font-bold text-foreground leading-tight max-w-3xl">
            Quem participa,{' '}
            <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
              transforma.
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Sua opinião contribui para construir uma UniRios cada vez melhor.
          </p>
          <div className="mt-8 p-6 rounded-xl bg-card border shadow-sm max-w-2xl">
            <p className="text-sm font-semibold text-primary mb-1">CPA 2026 — Avaliação Institucional</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              24 de agosto a 18 de setembro de 2026
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Cada resposta ajuda a identificar necessidades, reconhecer avanços e definir novos caminhos.
              Quando você participa, contribui para transformar a realidade da nossa instituição.
            </p>
          </div>

          {/* Fases indicator */}
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Metodologia em 3 fases</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fases.map((f, i) => {
                const Icon = f.icon;
                const ativa = f.id === faseAtual;
                return (
                  <button
                    key={f.id}
                    onClick={() => alterarFase(f.id)}
                    className={cn(
                      'text-left p-4 rounded-lg border-2 transition-all bg-gradient-to-br',
                      f.cor,
                      ativa ? 'ring-2 ring-primary shadow-md scale-[1.02]' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{f.numero}</span>
                      {ativa && <Badge className="ml-auto text-[10px] h-5">Atual</Badge>}
                    </div>
                    <p className="font-heading font-bold text-foreground">{f.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.descricao}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A coordenação da CPA pode alternar a fase clicando nos cards acima.
            </p>
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section id="metodologia" className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <h3 className="text-3xl font-heading font-bold text-foreground">Metodologia</h3>
            <p className="text-muted-foreground mt-2">
              Planejamento &rarr; Desenvolvimento &rarr; Consolidação
            </p>
          </div>

          <div className="space-y-8">
            {fases.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.id} className={cn('border-2', f.id === faseAtual && 'ring-2 ring-primary/40')}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-lg bg-gradient-to-br flex items-center justify-center border', f.cor)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{f.numero}</p>
                        <CardTitle className="font-heading">{f.titulo}</CardTitle>
                      </div>
                      {f.id === faseAtual && <Badge className="ml-auto">Fase atual</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {f.etapas.map((et, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                          Etapa {idx + 1}
                        </p>
                        <p className="font-heading font-semibold text-foreground mb-3">{et.titulo}</p>
                        <ul className="space-y-1.5">
                          {et.itens.map((it, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-success flex-shrink-0" />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cronograma */}
      <section id="cronograma" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8 flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-primary" />
            <div>
              <h3 className="text-3xl font-heading font-bold text-foreground">Cronograma</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Linha do tempo com as atividades da campanha CPA 2026.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-heading font-semibold text-foreground">Data</th>
                      <th className="text-left px-4 py-3 font-heading font-semibold text-foreground">Atividade</th>
                      <th className="text-left px-4 py-3 font-heading font-semibold text-foreground">Responsável</th>
                      <th className="text-left px-4 py-3 font-heading font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronograma.map((item, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{item.data}</td>
                        <td className="px-4 py-3 text-foreground">{item.atividade}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.responsavel}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Orientações */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8 flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-primary" />
            <h3 className="text-3xl font-heading font-bold text-foreground">Orientações da avaliação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { t: 'Sigilo garantido', d: 'As respostas são anônimas e utilizadas apenas para fins estatísticos e de melhoria institucional.' },
              { t: 'Participe até 18/09', d: 'A avaliação estará disponível de 24 de agosto a 18 de setembro de 2026.' },
              { t: 'Responda com atenção', d: 'Considere cada questão de forma reflexiva. Sua opinião orienta as ações da CPA.' },
              { t: 'Todos os módulos', d: 'É obrigatório avaliar todas as dimensões antes de concluir a participação.' },
              { t: 'Apoio disponível', d: 'Nos dias 14, 15 e 16 de setembro haverá apoio presencial no laboratório do terceiro andar.' },
              { t: 'Dúvidas?', d: 'Procure o coordenador do seu curso ou a Comissão Própria de Avaliação.' },
            ].map((o, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <p className="font-heading font-semibold text-foreground mb-1.5">{o.t}</p>
                  <p className="text-sm text-muted-foreground">{o.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-xl bg-gradient-to-r from-primary to-info text-primary-foreground text-center">
            <p className="text-2xl font-heading font-bold">Quem participa, transforma.</p>
            <p className="mt-2 opacity-90">CPA 2026 — Participe da Avaliação Institucional.</p>
            <div className="mt-5 flex justify-center gap-3 flex-wrap">
              <Button asChild variant="secondary" size="lg">
                <Link to="/avaliacao">Acessar avaliação</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/painel">Portal de Relatórios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 bg-card">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Comissão Própria de Avaliação · UniRios · 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
