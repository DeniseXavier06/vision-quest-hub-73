import { eixosData, acoesData, reunioesData, statusLabels } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'info';
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardOverview = () => {
  const totalAcoes = acoesData.length;
  const concluidas = acoesData.filter((a) => a.status === 'concluida').length;
  const emAndamento = acoesData.filter((a) => a.status === 'em_andamento').length;
  const atrasadas = acoesData.filter((a) => a.diasRestantes < 0 && a.status !== 'concluida').length;

  const prazosProximos = acoesData
    .filter((a) => a.diasRestantes > 0 && a.diasRestantes <= 30 && a.status !== 'concluida')
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do plano de ação da CPA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListChecks} label="Total de Ações" value={totalAcoes} variant="primary" />
        <StatCard icon={CheckCircle2} label="Concluídas" value={concluidas} variant="success" />
        <StatCard icon={Clock} label="Em Andamento" value={emAndamento} variant="info" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={atrasadas} variant="warning" />
      </div>

      {/* Progresso por Eixo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Progresso por Eixo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eixosData.map((eixo) => (
            <div key={eixo.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate pr-4">{eixo.nome}</span>
                <span className="text-muted-foreground flex-shrink-0">{eixo.percentualMedio}%</span>
              </div>
              <Progress value={eixo.percentualMedio} className="h-2" />
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-success">{eixo.acoesConcluidas} concluídas</span>
                <span className="text-info">{eixo.acoesEmAndamento} em andamento</span>
                <span>{eixo.acoesNaoIniciadas} pendentes</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prazos e Reuniões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Prazos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prazo nos próximos 30 dias.</p>
            ) : (
              <div className="space-y-3">
                {prazosProximos.map((acao) => (
                  <div key={acao.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{acao.nome}</p>
                      <p className="text-xs text-muted-foreground">{acao.responsavel} · {acao.eixo}</p>
                    </div>
                    <Badge variant={acao.diasRestantes <= 7 ? 'destructive' : 'secondary'} className="ml-3 flex-shrink-0">
                      {acao.diasRestantes}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reunioesData.map((reuniao) => {
                const date = new Date(reuniao.dataHora);
                return (
                  <div key={reuniao.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary leading-none">
                        {date.toLocaleDateString('pt-BR', { day: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-primary/70 uppercase">
                        {date.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{reuniao.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {reuniao.local}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {statusLabels[reuniao.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
