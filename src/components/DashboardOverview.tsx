import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Users,
  Building2,
  BarChart3,
} from 'lucide-react';

interface DashboardOverviewProps {
  onSectionChange?: (section: string) => void;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  variant,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
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

const DashboardOverview = ({ onSectionChange }: DashboardOverviewProps) => {
  const [acoes, setAcoes] = useState<any[]>([]);
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<number>(0);
  const [setoresCount, setSetoresCount] = useState<number>(0);
  const [resultadosCount, setResultadosCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const [acoesRes, reunioesRes, usuariosRes, setoresRes, resultadosRes] = await Promise.all([
        supabase.from('acoes').select('*').order('prazo'),
        supabase.from('reunioes').select('*').order('data_hora'),
        supabase.from('usuarios_cpa').select('id', { count: 'exact', head: true }),
        supabase.from('setores').select('id', { count: 'exact', head: true }),
        supabase.from('resultados').select('id', { count: 'exact', head: true }),
      ]);
      if (acoesRes.data) setAcoes(acoesRes.data);
      if (reunioesRes.data) setReunioes(reunioesRes.data);
      setUsuarios(usuariosRes.count || 0);
      setSetoresCount(setoresRes.count || 0);
      setResultadosCount(resultadosRes.count || 0);
    };
    fetchData();
  }, []);

  const totalAcoes = acoes.length;
  const concluidas = acoes.filter((a) => a.status === 'concluida').length;
  const emAndamento = acoes.filter((a) => a.status === 'em_andamento').length;
  const naoIniciadas = acoes.filter((a) => a.status === 'nao_iniciada').length;

  const hoje = new Date();
  const atrasadas = acoes.filter((a) => new Date(a.prazo) < hoje && a.status !== 'concluida').length;

  const prazosProximos = useMemo(() => {
    return acoes
      .filter((a) => {
        const dias = Math.ceil((new Date(a.prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return dias > 0 && dias <= 30 && a.status !== 'concluida';
      })
      .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
      .slice(0, 5);
  }, [acoes]);

  const proximasReunioes = useMemo(() => {
    return reunioes
      .filter((r) => new Date(r.data_hora) >= hoje && r.status === 'agendada')
      .slice(0, 5);
  }, [reunioes]);

  const eixosProgress = useMemo(() => {
    const map = new Map<string, { total: number; soma: number; concluidas: number; andamento: number; pendentes: number }>();
    acoes.forEach((a) => {
      const e = map.get(a.eixo) || { total: 0, soma: 0, concluidas: 0, andamento: 0, pendentes: 0 };
      e.total++;
      e.soma += a.percentual_progresso || 0;
      if (a.status === 'concluida') e.concluidas++;
      else if (a.status === 'em_andamento') e.andamento++;
      else e.pendentes++;
      map.set(a.eixo, e);
    });
    return [...map.entries()].map(([nome, d]) => ({
      nome,
      media: d.total > 0 ? Math.round(d.soma / d.total) : 0,
      concluidas: d.concluidas,
      andamento: d.andamento,
      pendentes: d.pendentes,
    }));
  }, [acoes]);

  const statusLabels: Record<string, string> = {
    agendada: 'Agendada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
  };

  const go = (section: string) => onSectionChange?.(section);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do plano de ação da CPA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListChecks} label="Total de Ações" value={totalAcoes} variant="primary" onClick={() => go('acoes')} />
        <StatCard icon={CheckCircle2} label="Concluídas" value={concluidas} variant="success" onClick={() => go('acoes')} />
        <StatCard icon={Clock} label="Em Andamento" value={emAndamento} variant="info" onClick={() => go('acoes')} />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={atrasadas} variant="warning" onClick={() => go('acoes')} />
      </div>

      {/* Stats secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Usuários" value={usuarios} variant="info" onClick={() => go('usuarios')} />
        <StatCard icon={Building2} label="Setores" value={setoresCount} variant="primary" onClick={() => go('setores')} />
        <StatCard icon={BarChart3} label="Resultados" value={resultadosCount} variant="success" onClick={() => go('resultados')} />
      </div>

      {/* Progresso por Eixo */}
      {eixosProgress.length > 0 && (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => go('acoes')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Progresso por Eixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eixosProgress.map((eixo) => (
              <div key={eixo.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate pr-4">{eixo.nome}</span>
                  <span className="text-muted-foreground flex-shrink-0">{eixo.media}%</span>
                </div>
                <Progress value={eixo.media} className="h-2" />
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="text-success">{eixo.concluidas} concluídas</span>
                  <span className="text-info">{eixo.andamento} em andamento</span>
                  <span>{eixo.pendentes} pendentes</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Prazos e Reuniões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2 cursor-pointer" onClick={() => go('acoes')}>
              <AlertTriangle className="w-4 h-4 text-warning" />
              Prazos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prazo nos próximos 30 dias.</p>
            ) : (
              <div className="space-y-3">
                {prazosProximos.map((acao) => {
                  const dias = Math.ceil((new Date(acao.prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={acao.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => go('acoes')}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{acao.nome}</p>
                        <p className="text-xs text-muted-foreground">{acao.responsavel} · {acao.eixo}</p>
                      </div>
                      <Badge variant={dias <= 7 ? 'destructive' : 'secondary'} className="ml-3 flex-shrink-0">
                        {dias}d
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2 cursor-pointer" onClick={() => go('reunioes')}>
              <CalendarDays className="w-4 h-4 text-primary" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximasReunioes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma reunião agendada.</p>
            ) : (
              <div className="space-y-3">
                {proximasReunioes.map((reuniao) => {
                  const date = new Date(reuniao.data_hora);
                  return (
                    <div
                      key={reuniao.id}
                      className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => go('reunioes')}
                    >
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
                        {statusLabels[reuniao.status] || reuniao.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
