import { avaliacoesData, statusLabels } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

const statusColors: Record<string, string> = {
  planejado: 'bg-muted text-muted-foreground',
  em_execucao: 'bg-info/10 text-info',
  concluido: 'bg-success/10 text-success',
};

const CronogramaSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Cronograma de Avaliações</h2>
        <p className="text-sm text-muted-foreground mt-1">Calendário das avaliações institucionais</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {avaliacoesData.map((av, idx) => (
          <Card key={av.id}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-heading font-semibold text-foreground">{av.tipo}</h3>
                  <Badge className={statusColors[av.status]} variant="secondary">
                    {statusLabels[av.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{av.descricao}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    📅 {new Date(av.dataInicio).toLocaleDateString('pt-BR')} — {new Date(av.dataFim).toLocaleDateString('pt-BR')}
                  </span>
                  <span>👤 {av.responsavel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra visual do cronograma */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Linha do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Months bar */}
            <div className="flex text-xs text-muted-foreground mb-3">
              {['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'].map((m) => (
                <div key={m} className="flex-1 text-center">{m}</div>
              ))}
            </div>
            <div className="space-y-2">
              {avaliacoesData.map((av) => {
                const startMonth = new Date(av.dataInicio).getMonth() - 2; // March = 0
                const endMonth = new Date(av.dataFim).getMonth() - 2;
                const totalMonths = 8;
                const left = (startMonth / totalMonths) * 100;
                const width = ((endMonth - startMonth + 1) / totalMonths) * 100;

                return (
                  <div key={av.id} className="relative h-8">
                    <div
                      className="absolute h-full rounded-md bg-primary/20 flex items-center px-2"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="text-xs font-medium text-primary truncate">{av.tipo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CronogramaSection;
