import { reunioesData, statusLabels } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Clock } from 'lucide-react';

const ReunioesSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Reuniões</h2>
        <p className="text-sm text-muted-foreground mt-1">Agenda de reuniões da CPA</p>
      </div>

      <div className="space-y-4">
        {reunioesData.map((reuniao) => {
          const date = new Date(reuniao.dataHora);
          return (
            <Card key={reuniao.id}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-lg font-heading font-bold text-primary leading-none">
                    {date.toLocaleDateString('pt-BR', { day: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-primary/70 uppercase font-medium">
                    {date.toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-heading font-semibold text-foreground">{reuniao.titulo}</h3>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {reuniao.local}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {reuniao.tipo}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">{statusLabels[reuniao.status]}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ReunioesSection;
