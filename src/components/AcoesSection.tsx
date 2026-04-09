import { useState } from 'react';
import { acoesData as initialAcoes, statusLabels, type Acao } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ListChecks, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  nao_iniciada: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-info/10 text-info',
  concluida: 'bg-success/10 text-success',
};

const emptyAcao: Omit<Acao, 'id' | 'diasRestantes'> = {
  nome: '',
  eixo: '',
  meta: '',
  responsavel: '',
  status: 'nao_iniciada',
  percentualProgresso: 0,
  prazo: '',
};

const eixosOptions = [
  'Planejamento e Avaliação',
  'Políticas Acadêmicas',
  'Políticas de Gestão',
  'Infraestrutura',
  'Valorização Profissional',
  'Imagem Institucional',
];

const AcoesSection = () => {
  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [filterEixo, setFilterEixo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Acao, 'id' | 'diasRestantes'>>(emptyAcao);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const eixos = [...new Set(acoes.map((a) => a.eixo))];

  const filtered = acoes.filter((a) => {
    if (filterEixo !== 'all' && a.eixo !== filterEixo) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const calcDiasRestantes = (prazo: string) => {
    const diff = new Date(prazo).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const openCreate = () => {
    setFormData(emptyAcao);
    setEditingId(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEdit = (acao: Acao) => {
    setFormData({
      nome: acao.nome,
      eixo: acao.eixo,
      meta: acao.meta,
      responsavel: acao.responsavel,
      status: acao.status,
      percentualProgresso: acao.percentualProgresso,
      prazo: acao.prazo,
    });
    setEditingId(acao.id);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const openView = (acao: Acao) => {
    setFormData({
      nome: acao.nome,
      eixo: acao.eixo,
      meta: acao.meta,
      responsavel: acao.responsavel,
      status: acao.status,
      percentualProgresso: acao.percentualProgresso,
      prazo: acao.prazo,
    });
    setEditingId(acao.id);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.eixo || !formData.responsavel || !formData.prazo) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (dialogMode === 'create') {
      const newAcao: Acao = {
        ...formData,
        id: crypto.randomUUID(),
        diasRestantes: calcDiasRestantes(formData.prazo),
      };
      setAcoes((prev) => [...prev, newAcao]);
      toast.success('Ação criada com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      setAcoes((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, ...formData, diasRestantes: calcDiasRestantes(formData.prazo) }
            : a
        )
      );
      toast.success('Ação atualizada com sucesso!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setAcoes((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success('Ação excluída com sucesso!');
      setDeleteId(null);
    }
  };

  const isReadOnly = dialogMode === 'view';
  const dialogTitle = dialogMode === 'create' ? 'Nova Ação' : dialogMode === 'edit' ? 'Editar Ação' : 'Detalhes da Ação';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Ações</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestão das ações do plano CPA</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Ação
        </Button>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((acao) => (
                  <TableRow key={acao.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{acao.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{acao.eixo}</TableCell>
                    <TableCell className="text-sm">{acao.responsavel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
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
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(acao)} title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acao)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(acao.id)} title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit / View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? 'Preencha os dados para criar uma nova ação.' : dialogMode === 'edit' ? 'Altere os dados da ação.' : 'Detalhes completos da ação.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Ação *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                readOnly={isReadOnly}
                placeholder="Ex: Divulgar resultados do Perfil Acadêmico"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Eixo *</Label>
                {isReadOnly ? (
                  <Input value={formData.eixo} readOnly />
                ) : (
                  <Select value={formData.eixo} onValueChange={(v) => setFormData({ ...formData, eixo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {eixosOptions.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  value={formData.meta}
                  onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                  readOnly={isReadOnly}
                  placeholder="Meta associada"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  readOnly={isReadOnly}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo *</Label>
                <Input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isReadOnly ? (
                  <Input value={statusLabels[formData.status]} readOnly />
                ) : (
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Acao['status'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Progresso (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.percentualProgresso}
                  onChange={(e) => setFormData({ ...formData, percentualProgresso: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  readOnly={isReadOnly}
                />
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                {dialogMode === 'create' ? 'Criar Ação' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ação? Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AcoesSection;
