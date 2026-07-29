import { useEffect, useState } from 'react';
import { statusLabels, type Avaliacao } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  planejado: 'bg-muted text-muted-foreground',
  em_execucao: 'bg-info/10 text-info',
  concluido: 'bg-success/10 text-success',
};

type StatusAv = 'planejado' | 'em_execucao' | 'concluido';
type ItemCronograma = Omit<Avaliacao, 'id' | 'status'> & { id: string; status: StatusAv; exibirHome: boolean };
type FormCronograma = Omit<ItemCronograma, 'id'>;

const emptyAvaliacao: FormCronograma = {
  tipo: '',
  descricao: '',
  dataInicio: '',
  dataFim: '',
  status: 'planejado',
  responsavel: '',
  exibirHome: false,
};

const tiposAvaliacao = [
  'Planejamento',
  'Desenvolvimento',
  'Consolidação',
];

const tipoSelectOptions = tiposAvaliacao.map((t) => ({ value: t, label: t }));

const statusSelectOptions = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'concluido', label: 'Concluído' },
];

const CronogramaSection = () => {
  const [avaliacoes, setAvaliacoes] = useState<ItemCronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<FormCronograma>(emptyAvaliacao);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAvaliacoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .order('data_inicio', { ascending: true });
    if (error) {
      toast.error('Erro ao carregar cronograma: ' + error.message);
    } else {
      setAvaliacoes(
        (data ?? []).map((r) => ({
          id: r.id,
          tipo: r.tipo,
          descricao: r.descricao ?? '',
          dataInicio: r.data_inicio,
          dataFim: r.data_fim,
          status: r.status as StatusAv,
          responsavel: r.responsavel,
          exibirHome: !!r.exibir_home,
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchAvaliacoes(); }, []);

  const toForm = (av: ItemCronograma): FormCronograma => ({
    tipo: av.tipo, descricao: av.descricao, dataInicio: av.dataInicio, dataFim: av.dataFim,
    status: av.status, responsavel: av.responsavel, exibirHome: av.exibirHome,
  });

  const openCreate = () => { setFormData(emptyAvaliacao); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (av: ItemCronograma) => {
    setFormData(toForm(av));
    setEditingId(av.id); setDialogMode('edit'); setDialogOpen(true);
  };
  const openView = (av: ItemCronograma) => {
    setFormData(toForm(av));
    setEditingId(av.id); setDialogMode('view'); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.tipo || !formData.dataInicio || !formData.dataFim || !formData.responsavel) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    const payload = {
      tipo: formData.tipo,
      descricao: formData.descricao || null,
      data_inicio: formData.dataInicio,
      data_fim: formData.dataFim,
      status: formData.status,
      responsavel: formData.responsavel,
      exibir_home: formData.exibirHome,
    };

    if (dialogMode === 'create') {
      const { error } = await supabase.from('avaliacoes').insert(payload);
      if (error) { toast.error('Erro ao cadastrar: ' + error.message); return; }
      toast.success('Avaliação cadastrada com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      const { error } = await supabase.from('avaliacoes').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
      toast.success('Avaliação atualizada com sucesso!');
    }
    setDialogOpen(false);
    fetchAvaliacoes();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('avaliacoes').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir: ' + error.message); return; }
    toast.success('Avaliação excluída com sucesso!');
    setDeleteId(null);
    fetchAvaliacoes();
  };

  const isReadOnly = dialogMode === 'view';
  const dialogTitle = dialogMode === 'create' ? 'Nova Avaliação' : dialogMode === 'edit' ? 'Editar Avaliação' : 'Detalhes da Avaliação';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Cronograma de Avaliações</h2>
          <p className="text-sm text-muted-foreground mt-1">Calendário das avaliações institucionais</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Nova Avaliação</Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar avaliações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!loading && avaliacoes.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação cadastrada.</p>
        )}
        {avaliacoes.filter((av) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return av.tipo.toLowerCase().includes(term) || av.descricao.toLowerCase().includes(term) || av.responsavel.toLowerCase().includes(term);
        }).map((av) => (
          <Card key={av.id}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-heading font-semibold text-foreground">{av.tipo}</h3>
                  <Badge className={statusColors[av.status]} variant="secondary">{statusLabels[av.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{av.descricao}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  <span>📅 {new Date(av.dataInicio).toLocaleDateString('pt-BR')} — {new Date(av.dataFim).toLocaleDateString('pt-BR')}</span>
                  <span>👤 {av.responsavel}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(av)} title="Visualizar"><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(av)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(av.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Linha do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex text-xs text-muted-foreground mb-3">
              {['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'].map((m) => (
                <div key={m} className="flex-1 text-center">{m}</div>
              ))}
            </div>
            <div className="space-y-2">
              {avaliacoes.map((av) => {
                const startMonth = new Date(av.dataInicio).getMonth() - 2;
                const endMonth = new Date(av.dataFim).getMonth() - 2;
                const totalMonths = 8;
                const left = Math.max(0, (startMonth / totalMonths) * 100);
                const width = Math.max(5, ((endMonth - startMonth + 1) / totalMonths) * 100);
                return (
                  <div key={av.id} className="relative h-8">
                    <div className="absolute h-full rounded-md bg-primary/20 flex items-center px-2" style={{ left: `${left}%`, width: `${width}%` }}>
                      <span className="text-xs font-medium text-primary truncate">{av.tipo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? 'Cadastre uma nova avaliação no cronograma.' : dialogMode === 'edit' ? 'Altere os dados da avaliação.' : 'Detalhes completos da avaliação.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Avaliação *</Label>
                {isReadOnly ? <Input value={formData.tipo} readOnly /> : (
                  <SearchableSelect value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })} options={tipoSelectOptions} placeholder="Selecione" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Input value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} readOnly={isReadOnly} placeholder="Nome do responsável" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} readOnly={isReadOnly} placeholder="Descreva a avaliação" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} readOnly={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} readOnly={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                {isReadOnly ? <Input value={statusLabels[formData.status]} readOnly /> : (
                  <SearchableSelect value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })} options={statusSelectOptions} />
                )}
              </div>
            </div>
          </div>
          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{dialogMode === 'create' ? 'Cadastrar' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Avaliação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta avaliação? Esta operação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CronogramaSection;
