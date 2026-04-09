import { useState } from 'react';
import { acoesData, statusLabels } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListChecks } from 'lucide-react';

const statusColors: Record<string, string> = {
  nao_iniciada: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-info/10 text-info',
  concluida: 'bg-success/10 text-success',
};

const AcoesSection = () => {
  const [filterEixo, setFilterEixo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const eixos = [...new Set(acoesData.map((a) => a.eixo))];

  const filtered = acoesData.filter((a) => {
    if (filterEixo !== 'all' && a.eixo !== filterEixo) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Ações</h2>
        <p className="text-sm text-muted-foreground mt-1">Gestão das ações do plano CPA</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterEixo} onValueChange={setFilterEixo}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por eixo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eixos</SelectItem>
            {eixos.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            {filtered.length} {filtered.length === 1 ? 'ação encontrada' : 'ações encontradas'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Eixo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((acao) => (
                  <TableRow key={acao.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">{acao.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{acao.eixo}</TableCell>
                    <TableCell className="text-sm">{acao.responsavel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={acao.percentualProgresso} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{acao.percentualProgresso}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(acao.prazo).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[acao.status]} variant="secondary">
                        {statusLabels[acao.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcoesSection;
