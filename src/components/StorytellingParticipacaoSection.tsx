import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Presentation,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const defaultChartColors = {
  primary: 'currentColor',
  destructive: 'currentColor',
  info: 'currentColor',
  warning: 'currentColor',
  success: 'currentColor',
  border: 'currentColor',
  muted: 'currentColor',
  background: 'currentColor',
  foreground: 'currentColor',
};

type Segment = {
  publico: string;
  short: string;
  p2024: number;
  p2025: number;
  p2026: number;
  deadline: string;
  priority: 1 | 2 | 3;
  reading: string;
  message: string;
  actions?: string[];
};

const percent = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const pp = (value: number) => `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} p.p.`;

const segments: Segment[] = [
  {
    publico: 'Alunos presenciais',
    short: 'Alunos Pres.',
    p2024: 72.97,
    p2025: 77.64,
    p2026: 79.66,
    deadline: '20/09',
    priority: 3,
    reading: 'Participação elevada, superando o resultado de 2025 e consolidando o avanço no triênio.',
    message:
      'Os alunos presenciais alcançaram o melhor resultado do triênio, demonstrando fortalecimento da cultura de avaliação.',
  },
  {
    publico: 'Alunos EAD',
    short: 'Alunos EAD',
    p2024: 33.88,
    p2025: 25.04,
    p2026: 18.45,
    deadline: '30/09',
    priority: 1,
    reading: 'Principal ponto de atenção, com redução acumulada no triênio e baixa adesão em 2026.',
    message:
      'A modalidade EAD é hoje o principal desafio de participação e exige mobilização direta nos canais dos estudantes.',
    actions: [
      'reforçar a divulgação no ambiente virtual',
      'enviar lembretes segmentados por turma e polo',
      'solicitar apoio dos coordenadores e tutores',
      'acompanhar diariamente a evolução da participação',
    ],
  },
  {
    publico: 'Professores presenciais',
    short: 'Prof. Pres.',
    p2024: 67.92,
    p2025: 85.94,
    p2026: 88.19,
    deadline: '30/09',
    priority: 3,
    reading: 'Participação elevada e crescente, com o melhor resultado do triênio.',
    message:
      'A mobilização das coordenações e lideranças acadêmicas produziu avanço e deve ser mantida.',
  },
  {
    publico: 'Professores EAD',
    short: 'Prof. EAD',
    p2024: 100,
    p2025: 93.23,
    p2026: 85.37,
    deadline: '30/09',
    priority: 2,
    reading: 'Participação elevada, embora ainda abaixo do resultado alcançado em 2025.',
    message:
      'Os professores EAD apresentaram recuperação expressiva; a mobilização específica deve continuar para reduzir a diferença em relação a 2025.',
  },
  {
    publico: 'Coordenadores presenciais',
    short: 'Coord. Pres.',
    p2024: 100,
    p2025: 81.82,
    p2026: 90,
    deadline: '30/09',
    priority: 3,
    reading: 'Participação elevada e em recuperação, superando 2025 e reforçando seu papel estratégico.',
    message:
      'Os coordenadores devem ser usados como força de mobilização nesta reta final da avaliação.',
  },
  {
    publico: 'Coordenadores EAD',
    short: 'Coord. EAD',
    p2024: 100,
    p2025: 100,
    p2026: 100,
    deadline: '30/09',
    priority: 3,
    reading: 'Adesão integral e consistente nos três anos.',
    message:
      'Os coordenadores EAD demonstram participação plena e podem apoiar diretamente a mobilização da modalidade.',
  },
  {
    publico: 'Colaboradores',
    short: 'Colab.',
    p2024: 72.48,
    p2025: 91.45,
    p2026: 91.16,
    deadline: '30/09',
    priority: 3,
    reading: 'Participação elevada e estável em relação a 2025, mantendo forte adesão no triênio.',
    message:
      'A atuação das lideranças de cada setor sustentou a alta adesão e deve permanecer como prática de mobilização.',
  },
];

const trendData = [
  { ano: '2024', 'Alunos presenciais': 72.97, 'Alunos EAD': 33.88, 'Professores presenciais': 67.92, 'Professores EAD': 100, Colaboradores: 72.48 },
  { ano: '2025', 'Alunos presenciais': 77.64, 'Alunos EAD': 25.04, 'Professores presenciais': 85.94, 'Professores EAD': 93.23, Colaboradores: 91.45 },
  { ano: '2026', 'Alunos presenciais': 79.66, 'Alunos EAD': 18.45, 'Professores presenciais': 88.19, 'Professores EAD': 85.37, Colaboradores: 91.16 },
];

const priorityConfig = {
  1: { label: 'Mobilização imediata', icon: AlertTriangle, className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  2: { label: 'Recuperação', icon: TrendingUp, className: 'border-warning/30 bg-warning/10 text-warning' },
  3: { label: 'Manutenção', icon: CheckCircle2, className: 'border-success/30 bg-success/10 text-success' },
};

const courseChartData = segments.map((segment) => ({
  publico: segment.short,
  participacao: segment.p2026,
  prioridade: segment.priority,
}));

const resolveTokenColor = (token: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value ? `hsl(${value})` : 'currentColor';
};

const StorytellingParticipacaoSection = () => {
  const biggestDrop = segments.reduce((lowest, segment) => {
    const variation = segment.p2026 - segment.p2025;
    return variation < lowest.variation ? { segment, variation } : lowest;
  }, { segment: segments[0], variation: segments[0].p2026 - segments[0].p2025 });

  const average2026 = segments.reduce((sum, segment) => sum + segment.p2026, 0) / segments.length;
  const [chartColors, setChartColors] = useState(defaultChartColors);

  useEffect(() => {
    setChartColors({
      primary: resolveTokenColor('--primary'),
      destructive: resolveTokenColor('--destructive'),
      info: resolveTokenColor('--info'),
      warning: resolveTokenColor('--warning'),
      success: resolveTokenColor('--success'),
      border: resolveTokenColor('--border'),
      muted: resolveTokenColor('--muted-foreground'),
      background: resolveTokenColor('--background'),
      foreground: resolveTokenColor('--foreground'),
    });
  }, []);

  const getPriorityColor = (priority: Segment['priority']) => {
    if (priority === 1) return chartColors.destructive;
    if (priority === 2) return chartColors.warning;
    return chartColors.success;
  };

  const startPresentation = () => {
    const element = document.getElementById('storytelling-participacao');
    if (element?.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  return (
    <section id="storytelling-participacao" className="space-y-6 bg-background text-foreground">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit gap-2">
            <Presentation className="h-3.5 w-3.5" />
            Storytelling da participação
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
              Da participação à representatividade: onde estamos na Autoavaliação Institucional 2024–2026
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground lg:text-base">
              A participação revela o grau de envolvimento de cada público e determina o quanto os resultados representarão a realidade institucional. Os dados de 2026 ainda são parciais, pois o período de coleta permanece aberto.
            </p>
          </div>
        </div>
        <Button onClick={startPresentation} className="shrink-0">
          <Presentation className="h-4 w-4" />
          Apresentar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Média 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{percent(average2026)}</div>
            <p className="mt-2 text-sm text-muted-foreground">Participação parcial média entre os públicos avaliados.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Maior queda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{pp(biggestDrop.variation)}</div>
            <p className="mt-2 text-sm text-muted-foreground">{biggestDrop.segment.publico} em relação a 2025.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Encerramento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">20/09 e 30/09</div>
            <p className="mt-2 text-sm text-muted-foreground">Alunos presenciais encerram primeiro; demais públicos seguem até 30/09.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Visão geral do triênio</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.border} strokeDasharray="3 3" />
                <XAxis dataKey="ano" stroke={chartColors.muted} />
                <YAxis stroke={chartColors.muted} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => percent(value)} contentStyle={{ background: chartColors.background, borderColor: chartColors.border, color: chartColors.foreground }} />
                <Area type="monotone" dataKey="Alunos presenciais" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.16} strokeWidth={2} />
                <Area type="monotone" dataKey="Alunos EAD" stroke={chartColors.destructive} fill={chartColors.destructive} fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="Professores presenciais" stroke={chartColors.info} fill={chartColors.info} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="Professores EAD" stroke={chartColors.warning} fill={chartColors.warning} fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="Colaboradores" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participação 2026 por público</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseChartData} margin={{ top: 24, right: 8, left: 0, bottom: 36 }}>
                <CartesianGrid stroke={chartColors.border} strokeDasharray="3 3" />
                <XAxis dataKey="publico" stroke={chartColors.muted} angle={-25} textAnchor="end" interval={0} height={62} />
                <YAxis stroke={chartColors.muted} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => percent(value)} contentStyle={{ background: chartColors.background, borderColor: chartColors.border, color: chartColors.foreground }} />
                <Bar dataKey="participacao" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="participacao" position="top" formatter={(value: number) => percent(value)} className="fill-foreground text-xs" />
                  {courseChartData.map((entry) => (
                    <Cell key={entry.publico} fill={getPriorityColor(entry.prioridade)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Público</TableHead>
                <TableHead>2024</TableHead>
                <TableHead>2025</TableHead>
                <TableHead>2026 até o momento</TableHead>
                <TableHead>Variação 2026 x 2025</TableHead>
                <TableHead>Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => {
                const variation = segment.p2026 - segment.p2025;
                return (
                  <TableRow key={segment.publico}>
                    <TableCell className="font-medium">{segment.publico}</TableCell>
                    <TableCell>{percent(segment.p2024)}</TableCell>
                    <TableCell>{percent(segment.p2025)}</TableCell>
                    <TableCell>{percent(segment.p2026)}</TableCell>
                    <TableCell className={cn(variation < 0 ? 'text-destructive' : 'text-success')}>{variation === 0 ? 'Estável' : pp(variation)}</TableCell>
                    <TableCell>{segment.deadline}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((priority) => {
          const config = priorityConfig[priority as Segment['priority']];
          const Icon = config.icon;
          return (
            <Card key={priority} className={cn('border', config.className)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  Prioridade {priority} — {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segments.filter((segment) => segment.priority === priority).map((segment) => (
                  <div key={segment.publico} className="rounded-md border border-border bg-card p-3 text-card-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{segment.publico}</span>
                      <span className="text-sm font-semibold">{percent(segment.p2026)}</span>
                    </div>
                    <Progress value={segment.p2026} className="mt-2 h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        {segments.map((segment, index) => {
          const variation = segment.p2026 - segment.p2025;
          return (
            <Card key={segment.publico}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{String(index + 2).padStart(2, '0')}</Badge>
                    <CardTitle>{segment.publico}</CardTitle>
                  </div>
                  <Badge className={cn('w-fit', priorityConfig[segment.priority].className)} variant="outline">
                    {priorityConfig[segment.priority].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-3">
                  <div className="text-4xl font-semibold text-foreground">{percent(segment.p2026)}</div>
                  <div className={cn('text-sm font-medium', variation < 0 ? 'text-destructive' : 'text-success')}>{variation === 0 ? 'Estável em relação a 2025' : `${pp(variation)} em relação a 2025`}</div>
                  <Progress value={segment.p2026} className="h-2" />
                  <p className="text-sm text-muted-foreground">Encerramento da avaliação: {segment.deadline}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">O que essa história revela?</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{segment.reading}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-4">
                    <h3 className="text-sm font-semibold text-foreground">Mensagem para a Reitoria</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{segment.message}</p>
                  </div>
                  {segment.actions && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Megaphone className="h-4 w-4 text-primary" />
                        Ações recomendadas
                      </h3>
                      <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        {segment.actions.map((action) => (
                          <li key={action} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prazos e orientação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                ['Alunos presenciais', '20/09', 'Intensificar a mobilização imediatamente'],
                ['Alunos EAD', '30/09', 'Prioridade máxima de comunicação'],
                ['Colaboradores', '30/09', 'Reforçar comunicação das lideranças'],
                ['Coordenadores', '30/09', 'Utilizar o segmento como agente mobilizador'],
                ['Professores', '30/09', 'Solicitar apoio das coordenações e gestores'],
              ].map(([publico, prazo, orientacao]) => (
                <div key={publico} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_auto_1.3fr] sm:items-center">
                  <span className="font-medium text-foreground">{publico}</span>
                  <Badge variant="secondary" className="w-fit">{prazo}</Badge>
                  <span className="text-sm text-muted-foreground">{orientacao}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagem final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              A participação na Autoavaliação Institucional de 2026 apresenta resultados elevados na maioria dos públicos, com crescimento entre alunos e professores presenciais e coordenadores presenciais. Os coordenadores EAD mantêm adesão integral, enquanto os colaboradores permanecem próximos ao patamar de 2025. O principal ponto de atenção continua sendo a participação dos alunos EAD.
            </p>
            <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-primary">
              <h3 className="font-semibold">Frase-síntese</h3>
              <p className="mt-1">
                Em 2026, a mobilização alcançou ou superou 79% em seis dos sete públicos, mas a baixa adesão dos alunos EAD ainda compromete sua representatividade.
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <h3 className="font-semibold text-foreground">Recomendação para a versão final</h3>
              <p className="mt-1">
                Acrescentar o quantitativo real com avaliados, público esperado e participação para cada ano, reforçando a leitura da taxa de adesão e do número absoluto de pessoas alcançadas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StorytellingParticipacaoSection;