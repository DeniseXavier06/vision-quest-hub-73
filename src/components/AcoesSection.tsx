import { useState, useCallback, useEffect } from 'react';
import { statusLabels } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ListChecks, Plus, Eye, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import { useSortable } from '@/hooks/use-sortable';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useColumnOrder, type ColumnDef } from '@/hooks/use-column-order';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface AcaoLocal {
  id: string;
  nome: string;
  eixo: string;
  area: string;
  setores: string;
  meta: string;
  responsavel: string;
  status: 'nao_iniciada' | 'em_andamento' | 'concluida';
  percentualProgresso: number;
  prazo: string;
  diasRestantes: number;
}

const statusColors: Record<string, string> = {
  nao_iniciada: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-info/10 text-info',
  concluida: 'bg-success/10 text-success',
};

type StatusAcao = 'nao_iniciada' | 'em_andamento' | 'concluida';
const emptyForm: { nome: string; eixo: string; area: string; setores: string; meta: string; responsavel: string; status: StatusAcao; percentualProgresso: number; prazo: string } = { nome: '', eixo: '', area: '', setores: '', meta: '', responsavel: '', status: 'nao_iniciada', percentualProgresso: 0, prazo: '' };

const eixosOptions = [
  'Planejamento e Avaliação', 'Políticas Acadêmicas', 'Políticas de Gestão',
  'Infraestrutura', 'Valorização Profissional', 'Imagem Institucional',
  'Ambiente Virtual Aprendizagem', 'Avaliando a Infraestrutura', 'Avaliando a Valorização Profissional',
  'Avaliando a Comunicação', 'Avaliando os Serviços', 'Avaliando a Gestão',
];
const eixosSelectOptions = eixosOptions.map((e) => ({ value: e, label: e }));

const areasOptions = [
  'Ambiente Virtual de Aprendizagem',
  'Biblioteca',
  'Laboratórios',
  'Sala de Aula',
  'Atendimentos aos Alunos',
  'Imagem da Instituição',
  'Atendimento do Coordenador aos Alunos',
  'Avaliação de Aprendizagem',
  'Imagem do curso',
  'Organização didático-pedagógica',
  'Estratégias de Ensino',
  'O envolvimento do Aluno',
];
const areasSelectOptions = areasOptions.map((a) => ({ value: a, label: a }));

const statusSelectOptions = [
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
];

function parseStatus(val: string): 'nao_iniciada' | 'em_andamento' | 'concluida' {
  const v = (val || '').toLowerCase().trim();
  if (v.includes('andamento') || v.includes('progresso')) return 'em_andamento';
  if (v.includes('conclu') || v.includes('finaliz')) return 'concluida';
  return 'nao_iniciada';
}

function parsePrazo(val: string): string {
  if (!val) return '';
  const parts = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.substring(0, 10);
  return '';
}

function parseProgress(val: unknown): number {
  if (val == null || val === '') return 0;
  const n = Number(String(val).replace('%', '').replace(',', '.'));
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
}

function calcDias(prazo: string) {
  return Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000);
}

function ResponsaveisInput({ value, onChange, readOnly }: { value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  const [input, setInput] = useState('');
  const list = value.split(',').map((r) => r.trim()).filter(Boolean);
  const add = (raw: string) => {
    const parts = raw.split(',').map((r) => r.trim()).filter(Boolean);
    const next = [...list];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next.join(', '));
    setInput('');
  };
  const remove = (name: string) => onChange(list.filter((r) => r !== name).join(', '));
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) add(input);
    } else if (e.key === 'Backspace' && !input && list.length > 0) {
      remove(list[list.length - 1]);
    }
  };
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5 min-h-9 px-3 py-2 border rounded-md bg-muted/30">
        {list.length === 0 ? <span className="text-xs text-muted-foreground">—</span> :
          list.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 min-h-9 px-2 py-1.5 border rounded-md focus-within:ring-2 focus-within:ring-ring">
      {list.map((r) => (
        <Badge key={r} variant="secondary" className="text-xs gap-1 pr-1">
          {r}
          <button type="button" onClick={() => remove(r)} className="hover:bg-muted-foreground/20 rounded-sm">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && add(input)}
        placeholder={list.length === 0 ? 'Digite um nome e pressione Enter' : ''}
      />
    </div>
  );
}

const AcoesSection = () => {
  const [acoes, setAcoes] = useState<AcaoLocal[]>([]);
  const [filterEixo, setFilterEixo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcao, setFilterAcao] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchAcoes = useCallback(async () => {
    const { data, error } = await supabase.from('acoes').select('*').order('prazo', { ascending: true });
    if (error) { toast.error('Erro ao carregar ações'); return; }
    setAcoes((data || []).map((a) => ({
      id: a.id, nome: a.nome, eixo: a.eixo, meta: a.meta || '', responsavel: a.responsavel,
      status: a.status, percentualProgresso: a.percentual_progresso, prazo: a.prazo,
      diasRestantes: calcDias(a.prazo),
    })));
  }, []);

  useEffect(() => { fetchAcoes(); }, [fetchAcoes]);

  const eixos = [...new Set(acoes.map((a) => a.eixo))];
  const filterEixoOptions = [{ value: 'all', label: 'Todas as dimensões' }, ...eixos.map((e) => ({ value: e, label: e }))];
  const filterStatusOptions = [{ value: 'all', label: 'Todos os status' }, ...statusSelectOptions];
  const responsaveis = [...new Set(acoes.flatMap((a) => a.responsavel.split(',').map(r => r.trim())).filter(Boolean))].sort();
  const filterResponsavelOptions = [{ value: 'all', label: 'Todos os responsáveis' }, ...responsaveis.map((r) => ({ value: r, label: r }))];
  const nomesAcoes = [...new Set(acoes.map((a) => a.nome))].sort();
  const filterAcaoOptions = [{ value: 'all', label: 'Todas as ações' }, ...nomesAcoes.map((n) => ({ value: n, label: n.length > 60 ? n.substring(0, 57) + '...' : n }))];

  const filtered = acoes.filter((a) => {
    if (filterAcao !== 'all' && a.nome !== filterAcao) return false;
    if (filterEixo !== 'all' && a.eixo !== filterEixo) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterResponsavel !== 'all' && !a.responsavel.toLowerCase().includes(filterResponsavel.toLowerCase())) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!a.nome.toLowerCase().includes(term) && !a.responsavel.toLowerCase().includes(term) && !a.eixo.toLowerCase().includes(term) && !a.meta.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const { sorted: sortedFiltered, sortConfig, requestSort } = useSortable(filtered);

  const acaoColumns: ColumnDef[] = [
    { key: 'nome', label: 'Ação' },
    { key: 'eixo', label: 'Dimensão' },
    { key: 'meta', label: 'Meta' },
    { key: 'responsavel', label: 'Responsável' },
    { key: 'percentualProgresso', label: 'Progresso' },
    { key: 'prazo', label: 'Prazo' },
    { key: 'status', label: 'Status' },
  ];
  const { columns: orderedCols, dragIndex, overIndex, onDragStart, onDragOver, onDragEnd } = useColumnOrder(acaoColumns, 'acoes');

  const renderAcaoCell = (key: string, acao: AcaoLocal) => {
    switch (key) {
      case 'nome': return <TableCell key={key} className="font-medium text-xs whitespace-normal break-words">{acao.nome}</TableCell>;
      case 'eixo': return <TableCell key={key} className="text-xs text-muted-foreground whitespace-normal break-words">{acao.eixo}</TableCell>;
      case 'meta': return <TableCell key={key} className="text-xs whitespace-normal break-words">{acao.meta || '—'}</TableCell>;
      case 'responsavel': return <TableCell key={key} className="text-xs whitespace-normal break-words">{acao.responsavel}</TableCell>;
      case 'percentualProgresso': return <TableCell key={key}><div className="flex items-center gap-1.5 min-w-[80px]"><Progress value={acao.percentualProgresso} className="h-1.5 flex-1" /><span className="text-[11px] text-muted-foreground w-7">{acao.percentualProgresso}%</span></div></TableCell>;
      case 'prazo': return <TableCell key={key} className="text-xs whitespace-nowrap">{new Date(acao.prazo).toLocaleDateString('pt-BR')}</TableCell>;
      case 'status': return <TableCell key={key}><Badge className={`${statusColors[acao.status]} text-[11px] px-1.5 py-0.5`} variant="secondary">{statusLabels[acao.status]}</Badge></TableCell>;
      default: return null;
    }
  };

  const openCreate = () => { setFormData(emptyForm); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (a: AcaoLocal) => {
    setFormData({ nome: a.nome, eixo: a.eixo, meta: a.meta, responsavel: a.responsavel, status: a.status, percentualProgresso: a.percentualProgresso, prazo: a.prazo });
    setEditingId(a.id); setDialogMode('edit'); setDialogOpen(true);
  };
  const openView = (a: AcaoLocal) => {
    setFormData({ nome: a.nome, eixo: a.eixo, meta: a.meta, responsavel: a.responsavel, status: a.status, percentualProgresso: a.percentualProgresso, prazo: a.prazo });
    setEditingId(a.id); setDialogMode('view'); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.eixo || !formData.responsavel || !formData.prazo) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    const payload = {
      nome: formData.nome, eixo: formData.eixo, meta: formData.meta, responsavel: formData.responsavel,
      status: formData.status as 'nao_iniciada' | 'em_andamento' | 'concluida',
      percentual_progresso: formData.percentualProgresso, prazo: formData.prazo,
    };
    if (dialogMode === 'create') {
      const { error } = await supabase.from('acoes').insert(payload);
      if (error) { toast.error('Erro ao criar ação'); return; }
      toast.success('Ação criada com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      const { error } = await supabase.from('acoes').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar ação'); return; }
      toast.success('Ação atualizada com sucesso!');
    }
    setDialogOpen(false);
    fetchAcoes();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('acoes').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Ação excluída com sucesso!');
    setDeleteId(null);
    fetchAcoes();
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    try {
      let totalImported = 0;
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        const rows: any[] = [];
        for (const row of json) {
          const acao = String(
            row['Ação'] ?? row['ACAO'] ?? row['ação'] ??
            Object.entries(row).find(([key]) => key.startsWith('•') || key.includes('Realizar verificação'))?.[1] ?? ''
          ).trim();
          if (!acao) continue;

          const responsavel = String(row['Responsável'] ?? row['RESPONSAVEL'] ?? row['responsavel'] ?? '').trim();
          const area = String(row['Área'] ?? row['AREA'] ?? row['Area'] ?? row['área'] ?? '').trim();
          const dimensao = String(row['DIMENSAO'] ?? row['Dimensão'] ?? row['dimensao'] ?? '').trim();
          const curso = String(row['NOME_CURSO'] ?? row['nome_curso'] ?? '').trim();
          const questao = String(row['TEXTO_QUESTAO'] ?? row['QUESTÃO'] ?? row['texto_questao'] ?? '').trim();
          const prazoRaw = String(row['Prazo'] ?? row['PRAZO'] ?? row['prazo'] ?? '');
          const statusRaw = String(row['Status'] ?? row['STATUS'] ?? row['status'] ?? '');
          const progressRaw = row['% Progresso'] ?? row['%_PROGRESSO'] ?? row['progresso'] ?? 0;

          rows.push({
            nome: acao,
            eixo: area || dimensao || 'Sem Eixo',
            meta: curso ? `${curso}${questao ? ' - ' + questao : ''}` : questao || '',
            responsavel: responsavel || 'Não informado',
            status: parseStatus(statusRaw),
            percentual_progresso: parseProgress(progressRaw),
            prazo: parsePrazo(prazoRaw) || new Date().toISOString().slice(0, 10),
          });
        }

        // Insert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await supabase.from('acoes').insert(batch);
          if (error) { console.error(error); toast.error(`Erro ao inserir lote`); }
        }
        totalImported += rows.length;
      }
      toast.success(`${totalImported} ações importadas!`);
      fetchAcoes();
    } catch (err) {
      toast.error('Erro ao importar. Verifique o formato do arquivo.');
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }, [fetchAcoes]);

  const isReadOnly = dialogMode === 'view';
  const dialogTitle = dialogMode === 'create' ? 'Nova Ação' : dialogMode === 'edit' ? 'Editar Ação' : 'Detalhes da Ação';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Ações</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestão das ações do plano CPA</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" className="gap-2" disabled={importing} asChild>
              <span><Upload className="w-4 h-4" />{importing ? 'Importando...' : 'Importar'}</span>
            </Button>
            <input type="file" accept=".xlsx,.xls,.csv" multiple className="hidden" onChange={handleImport} />
          </label>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Nova Ação</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar ações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <SearchableSelect value={filterEixo} onValueChange={setFilterEixo} options={filterEixoOptions} placeholder="Filtrar por dimensão" className="w-[220px]" />
        <SearchableSelect value={filterAcao} onValueChange={setFilterAcao} options={filterAcaoOptions} placeholder="Filtrar por ação" className="w-[250px]" />
        <SearchableSelect value={filterStatus} onValueChange={setFilterStatus} options={filterStatusOptions} placeholder="Filtrar por status" className="w-[180px]" />
        <SearchableSelect value={filterResponsavel} onValueChange={setFilterResponsavel} options={filterResponsavelOptions} placeholder="Filtrar por responsável" className="w-[220px]" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            {sortedFiltered.length} {sortedFiltered.length === 1 ? 'ação encontrada' : 'ações encontradas'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full text-xs">
              <TableHeader>
                <TableRow>
                  {orderedCols.map((col, idx) => (
                    <SortableTableHead key={col.key} sortKey={col.key} currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}
                      draggable isDragging={dragIndex === idx} isOver={overIndex === idx}
                      onDragStartCol={() => onDragStart(idx)} onDragOverCol={() => onDragOver(idx)} onDragEndCol={onDragEnd}
                    >{col.label}</SortableTableHead>
                  ))}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map((acao) => (
                  <TableRow key={acao.id}>
                    {orderedCols.map((col) => renderAcaoCell(col.key, acao))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(acao)} title="Visualizar"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acao)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(acao.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} readOnly={isReadOnly} placeholder="Ex: Divulgar resultados do Perfil Acadêmico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dimensão *</Label>
                {isReadOnly ? <Input value={formData.eixo} readOnly /> : (
                  <SearchableSelect value={formData.eixo} onValueChange={(v) => setFormData({ ...formData, eixo: v })} options={eixosSelectOptions} placeholder="Selecione" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input value={formData.meta} onChange={(e) => setFormData({ ...formData, meta: e.target.value })} readOnly={isReadOnly} placeholder="Meta associada" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsáveis *</Label>
                <ResponsaveisInput
                  value={formData.responsavel}
                  onChange={(v) => setFormData({ ...formData, responsavel: v })}
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo *</Label>
                <Input type="date" value={formData.prazo} onChange={(e) => setFormData({ ...formData, prazo: e.target.value })} readOnly={isReadOnly} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isReadOnly ? <Input value={statusLabels[formData.status]} readOnly /> : (
                  <SearchableSelect value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as StatusAcao })} options={statusSelectOptions} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Progresso (%)</Label>
                <Input type="number" min={0} max={100} value={formData.percentualProgresso} onChange={(e) => setFormData({ ...formData, percentualProgresso: Math.min(100, Math.max(0, Number(e.target.value))) })} readOnly={isReadOnly} />
              </div>
            </div>
          </div>
          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{dialogMode === 'create' ? 'Criar Ação' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Ação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta ação? Esta operação não pode ser desfeita.</AlertDialogDescription>
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

export default AcoesSection;
