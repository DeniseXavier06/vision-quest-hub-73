import { eixosData } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartColors = [
  'hsl(214, 60%, 35%)',
  'hsl(200, 65%, 45%)',
  'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 50%, 50%)',
  'hsl(340, 60%, 50%)',
];

const ResultadosSection = () => {
  const chartData = eixosData.map((e) => ({
    name: e.nome.length > 15 ? e.nome.substring(0, 15) + '…' : e.nome,
    progresso: e.percentualMedio,
    concluidas: e.acoesConcluidas,
    total: e.totalAcoes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Resultados</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada dos resultados e indicadores</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Progresso por Eixo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`${value}%`, 'Progresso']}
                />
                <Bar dataKey="progresso" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eixosData.map((eixo, idx) => (
          <Card key={eixo.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chartColors[idx] }}
                />
                <h3 className="text-sm font-heading font-semibold text-foreground">{eixo.nome}</h3>
              </div>
              <Progress value={eixo.percentualMedio} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{eixo.acoesConcluidas}/{eixo.totalAcoes} ações concluídas</span>
                <span className="font-medium text-foreground">{eixo.percentualMedio}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResultadosSection;
