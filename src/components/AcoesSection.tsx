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
import { ListChecks, Plus, Eye, Pencil, Trash2, Search, Upload, X, Copy, Combine } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
  'Desenvolvimento Institucional',
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
  'Polo',
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

function MultiSelectCombo({
  value, onChange, options, placeholder, readOnly, allowCreate,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  readOnly?: boolean;
  allowCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const list = value.split(',').map((r) => r.trim()).filter(Boolean);
  const setList = (next: string[]) => {
    const dedup: string[] = [];
    for (const n of next) if (n && !dedup.includes(n)) dedup.push(n);
    onChange(dedup.join(', '));
  };
  const toggle = (name: string) => {
    if (list.includes(name)) setList(list.filter((r) => r !== name));
    else setList([...list, name]);
  };
  const remove = (name: string) => setList(list.filter((r) => r !== name));

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5 min-h-9 px-3 py-2 border rounded-md bg-muted/30">
        {list.length === 0 ? <span className="text-xs text-muted-foreground">—</span> :
          list.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
      </div>
    );
  }

  const exists = options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap gap-1.5 min-h-9 px-2 py-1.5 border rounded-md">
        {list.map((r) => (
          <Badge key={r} variant="secondary" className="text-xs gap-1 pr-1">
            {r}
            <button type="button" onClick={() => remove(r)} className="hover:bg-muted-foreground/20 rounded-sm">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 min-w-[120px] text-left text-sm text-muted-foreground inline-flex items-center justify-between gap-2 px-1"
          >
            <span className="truncate">{list.length === 0 ? (placeholder || 'Selecione...') : 'Adicionar...'}</span>
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {allowCreate && search.trim() ? (
                <button
                  type="button"
                  className="w-full text-left text-sm px-2 py-1.5 hover:bg-accent rounded"
                  onClick={() => { toggle(search.trim()); setSearch(''); }}
                >
                  + Adicionar "{search.trim()}"
                </button>
              ) : 'Nenhum resultado.'}
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = list.includes(opt.label);
                return (
                  <CommandItem key={opt.value} value={opt.label} onSelect={() => toggle(opt.label)}>
                    <Check className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                    {opt.label}
                  </CommandItem>
                );
              })}
              {allowCreate && search.trim() && !exists && (
                <CommandItem value={`__add_${search}`} onSelect={() => { toggle(search.trim()); setSearch(''); }}>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  + Adicionar "{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


const AcoesSection = () => {
  const [acoes, setAcoes] = useState<AcaoLocal[]>([]);
  const [filterEixo, setFilterEixo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcao, setFilterAcao] = useState('all');
  const [filterSetores, setFilterSetores] = useState<string[]>([]);
  const [filterAreas, setFilterAreas] = useState<string[]>([]);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupConfirmOpen, setGroupConfirmOpen] = useState(false);
  const [grouping, setGrouping] = useState(false);

  const [usuariosOptions, setUsuariosOptions] = useState<{ value: string; label: string }[]>([]);
  const [setoresOptions, setSetoresOptions] = useState<{ value: string; label: string }[]>([]);

  const fetchAcoes = useCallback(async () => {
    const { data, error } = await supabase.from('acoes').select('*').order('prazo', { ascending: true });
    if (error) { toast.error('Erro ao carregar ações'); return; }
    setAcoes((data || []).map((a: any) => ({
      id: a.id, nome: a.nome, eixo: a.eixo, area: a.area || '', setores: a.setores || '',
      meta: a.meta || '', responsavel: a.responsavel,
      status: a.status, percentualProgresso: a.percentual_progresso, prazo: a.prazo,
      diasRestantes: calcDias(a.prazo),
    })));
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: us }, { data: st }] = await Promise.all([
        supabase.from('usuarios_cpa').select('nome').eq('ativo', true).order('nome'),
        supabase.from('setores').select('nome').eq('ativo', true).order('nome'),
      ]);
      setUsuariosOptions((us || []).map((u: any) => ({ value: u.nome, label: u.nome })));
      setSetoresOptions((st || []).map((s: any) => ({ value: s.nome, label: s.nome })));
    })();
  }, []);


  useEffect(() => { fetchAcoes(); }, [fetchAcoes]);

  const eixos = [...new Set(acoes.map((a) => a.eixo))];
  const filterEixoOptions = [{ value: 'all', label: 'Todas as dimensões' }, ...eixos.map((e) => ({ value: e, label: e }))];
  const filterStatusOptions = [{ value: 'all', label: 'Todos os status' }, ...statusSelectOptions];
  const responsaveis = [...new Set(acoes.flatMap((a) => a.responsavel.split(',').map(r => r.trim())).filter(Boolean))].sort();
  const filterResponsavelOptions = [{ value: 'all', label: 'Todos os responsáveis' }, ...responsaveis.map((r) => ({ value: r, label: r }))];
  const nomesAcoes = [...new Set(acoes.map((a) => a.nome))].sort();
  const filterAcaoOptions = [{ value: 'all', label: 'Todas as ações' }, ...nomesAcoes.map((n) => ({ value: n, label: n.length > 60 ? n.substring(0, 57) + '...' : n }))];
  const setoresDisponiveis = [...new Set(acoes.flatMap((a) => a.setores.split(',').map((s) => s.trim())).filter(Boolean))].sort();
  const areasDisponiveis = [...new Set(acoes.map((a) => (a.area || '').trim()).filter(Boolean))].sort();

  // Detecta ações repetidas pela combinação de Ação + Meta + Dimensão (ignora caixa e espaços extras)
  const normalizeText = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const dupKey = (a: AcaoLocal) => {
    const n = normalizeText(a.nome);
    const m = normalizeText(a.meta);
    const e = normalizeText(a.eixo);
    if (!n || !m || !e) return '';
    return `${n}||${m}||${e}`;
  };
  const dupCounts = acoes.reduce<Record<string, number>>((acc, a) => {
    const k = dupKey(a);
    if (k) acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const isDuplicate = (a: AcaoLocal) => {
    const k = dupKey(a);
    return !!k && (dupCounts[k] || 0) > 1;
  };
  const duplicatesCount = acoes.filter(isDuplicate).length;

  const filtered = acoes.filter((a) => {
    if (showOnlyDuplicates && !isDuplicate(a)) return false;
    if (filterAcao !== 'all' && a.nome !== filterAcao) return false;
    if (filterEixo !== 'all' && a.eixo !== filterEixo) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterResponsavel !== 'all' && !a.responsavel.toLowerCase().includes(filterResponsavel.toLowerCase())) return false;
    if (filterSetores.length > 0) {
      const acaoSetores = a.setores.split(',').map((s) => s.trim()).filter(Boolean);
      if (!filterSetores.some((s) => acaoSetores.includes(s))) return false;
    }
    if (filterAreas.length > 0) {
      if (!filterAreas.includes((a.area || '').trim())) return false;
    }
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
    { key: 'setores', label: 'Setor/Coordenação' },
    { key: 'meta', label: 'Meta' },
    { key: 'responsavel', label: 'Responsável' },
    { key: 'percentualProgresso', label: 'Progresso' },
    { key: 'prazo', label: 'Prazo' },
    { key: 'status', label: 'Status' },
  ];
  const { columns: orderedCols, dragIndex, overIndex, onDragStart, onDragOver, onDragEnd } = useColumnOrder(acaoColumns, 'acoes');

  const widthFor = (key: string) => {
    switch (key) {
      case 'nome': return 'w-[22%]';
      case 'eixo': return 'w-[12%]';
      case 'setores': return 'w-[12%]';
      case 'meta': return 'w-[14%]';
      case 'responsavel': return 'w-[14%]';
      case 'percentualProgresso': return 'w-[10%]';
      case 'prazo': return 'w-[8%]';
      case 'status': return 'w-[8%]';
      default: return '';
    }
  };

  const renderAcaoCell = (key: string, acao: AcaoLocal) => {
    const truncCls = 'text-xs align-top py-2 px-2 truncate max-w-0';
    switch (key) {
      case 'nome': return (
        <TableCell key={key} className={`${truncCls} font-medium`} title={acao.nome}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate">{acao.nome}</span>
            {isDuplicate(acao) && (
              <Badge variant="secondary" className="bg-warning/15 text-warning border border-warning/30 text-[10px] px-1.5 py-0 h-4 shrink-0 gap-0.5" title="Existem outras ações com a mesma Ação, Meta e Dimensão">
                <Copy className="w-2.5 h-2.5" />
                Repetida
              </Badge>
            )}
          </div>
        </TableCell>
      );
      case 'eixo': return <TableCell key={key} className={`${truncCls} text-muted-foreground`} title={acao.eixo}>{acao.eixo}</TableCell>;
      case 'setores': return <TableCell key={key} className={truncCls} title={acao.setores || ''}>{acao.setores || '—'}</TableCell>;
      case 'meta': return <TableCell key={key} className={truncCls} title={acao.meta || ''}>{acao.meta || '—'}</TableCell>;
      case 'responsavel': return <TableCell key={key} className={truncCls} title={acao.responsavel}>{acao.responsavel}</TableCell>;
      case 'percentualProgresso': return <TableCell key={key} className="py-2 px-2 align-middle"><div className="flex items-center gap-1.5"><Progress value={acao.percentualProgresso} className="h-1.5 flex-1" /><span className="text-[11px] text-muted-foreground w-7">{acao.percentualProgresso}%</span></div></TableCell>;
      case 'prazo': return <TableCell key={key} className="text-xs whitespace-nowrap py-2 px-2 align-middle">{new Date(acao.prazo).toLocaleDateString('pt-BR')}</TableCell>;
      case 'status': return <TableCell key={key} className="py-2 px-2 align-middle"><Badge className={`${statusColors[acao.status]} text-[11px] px-1.5 py-0.5`} variant="secondary">{statusLabels[acao.status]}</Badge></TableCell>;
      default: return null;
    }
  };


  const openCreate = () => { setFormData(emptyForm); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (a: AcaoLocal) => {
    setFormData({ nome: a.nome, eixo: a.eixo, area: a.area, setores: a.setores, meta: a.meta, responsavel: a.responsavel, status: a.status, percentualProgresso: a.percentualProgresso, prazo: a.prazo });
    setEditingId(a.id); setDialogMode('edit'); setDialogOpen(true);
  };
  const openView = (a: AcaoLocal) => {
    setFormData({ nome: a.nome, eixo: a.eixo, area: a.area, setores: a.setores, meta: a.meta, responsavel: a.responsavel, status: a.status, percentualProgresso: a.percentualProgresso, prazo: a.prazo });
    setEditingId(a.id); setDialogMode('view'); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.eixo || !formData.responsavel || !formData.prazo) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    const payload = {
      nome: formData.nome, eixo: formData.eixo, area: formData.area, setores: formData.setores,
      meta: formData.meta, responsavel: formData.responsavel,
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mergeCsv = (...vals: string[]) => {
    const set: string[] = [];
    for (const v of vals) {
      for (const item of (v || '').split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!set.includes(item)) set.push(item);
      }
    }
    return set.join(', ');
  };

  // Lista de duplicados realmente selecionados (apenas os que ainda são duplicados)
  const selectedDuplicates = acoes.filter((a) => selectedIds.has(a.id) && isDuplicate(a));

  // Agrupa selecionadas por dupKey
  const selectedGroups = selectedDuplicates.reduce<Record<string, AcaoLocal[]>>((acc, a) => {
    const k = dupKey(a);
    (acc[k] = acc[k] || []).push(a);
    return acc;
  }, {});
  // Só consideramos grupos com 2+ selecionadas
  const groupableGroups = Object.values(selectedGroups).filter((g) => g.length > 1);
  const totalToRemove = groupableGroups.reduce((sum, g) => sum + (g.length - 1), 0);

  const handleGroupSelected = async () => {
    if (groupableGroups.length === 0) return;
    setGrouping(true);
    try {
      for (const group of groupableGroups) {
        // Mantém a primeira (ordem atual: por prazo asc)
        const [keep, ...others] = group;
        const mergedResponsavel = mergeCsv(keep.responsavel, ...others.map((o) => o.responsavel));
        const mergedSetores = mergeCsv(keep.setores, ...others.map((o) => o.setores));
        const mergedArea = mergeCsv(keep.area, ...others.map((o) => o.area));
        const maxProgress = Math.max(keep.percentualProgresso, ...others.map((o) => o.percentualProgresso));
        // Status: se alguma estiver concluida -> concluida; se em andamento -> em_andamento
        const statuses = [keep.status, ...others.map((o) => o.status)];
        const status: StatusAcao = statuses.includes('concluida')
          ? 'concluida'
          : statuses.includes('em_andamento') ? 'em_andamento' : 'nao_iniciada';

        const { error: upErr } = await supabase.from('acoes').update({
          responsavel: mergedResponsavel,
          setores: mergedSetores,
          area: mergedArea,
          percentual_progresso: maxProgress,
          status,
        }).eq('id', keep.id);
        if (upErr) { toast.error('Erro ao mesclar ação'); continue; }

        const { error: delErr } = await supabase.from('acoes').delete().in('id', others.map((o) => o.id));
        if (delErr) { toast.error('Erro ao excluir repetidas'); continue; }
      }
      toast.success(`${groupableGroups.length} grupo(s) agrupado(s), ${totalToRemove} repetida(s) excluída(s).`);
      setSelectedIds(new Set());
      setGroupConfirmOpen(false);
      fetchAcoes();
    } finally {
      setGrouping(false);
    }
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-between font-normal">
              <span className="truncate">
                {filterSetores.length === 0
                  ? 'Filtrar por setor/coordenação'
                  : filterSetores.length === 1
                    ? filterSetores[0]
                    : `${filterSetores.length} setores selecionados`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar setor..." />
              <CommandList>
                <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                {filterSetores.length > 0 && (
                  <CommandGroup>
                    <CommandItem value="__clear__" onSelect={() => setFilterSetores([])}>
                      <X className="mr-2 h-4 w-4" />
                      Limpar seleção
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup>
                  {setoresDisponiveis.map((s) => {
                    const checked = filterSetores.includes(s);
                    return (
                      <CommandItem
                        key={s}
                        value={s}
                        onSelect={() => setFilterSetores(checked ? filterSetores.filter((x) => x !== s) : [...filterSetores, s])}
                      >
                        <Check className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                        {s}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-between font-normal">
              <span className="truncate">
                {filterAreas.length === 0
                  ? 'Filtrar por área'
                  : filterAreas.length === 1
                    ? filterAreas[0]
                    : `${filterAreas.length} áreas selecionadas`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar área..." />
              <CommandList>
                <CommandEmpty>Nenhuma área encontrada.</CommandEmpty>
                {filterAreas.length > 0 && (
                  <CommandGroup>
                    <CommandItem value="__clear__" onSelect={() => setFilterAreas([])}>
                      <X className="mr-2 h-4 w-4" />
                      Limpar seleção
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup>
                  {areasDisponiveis.map((a) => {
                    const checked = filterAreas.includes(a);
                    return (
                      <CommandItem
                        key={a}
                        value={a}
                        onSelect={() => setFilterAreas(checked ? filterAreas.filter((x) => x !== a) : [...filterAreas, a])}
                      >
                        <Check className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                        {a}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant={showOnlyDuplicates ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setShowOnlyDuplicates((v) => !v)}
          title="Mostrar apenas ações com título repetido"
        >
          <Copy className="w-4 h-4" />
          {showOnlyDuplicates ? 'Mostrando repetidas' : 'Apenas repetidas'}
          {duplicatesCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{duplicatesCount}</Badge>
          )}
        </Button>
        <Button
          type="button"
          variant="default"
          className="gap-2"
          disabled={groupableGroups.length === 0}
          onClick={() => setGroupConfirmOpen(true)}
          title="Mescla as repetidas selecionadas em uma só e exclui as demais"
        >
          <Combine className="w-4 h-4" />
          Agrupar selecionadas
          {selectedDuplicates.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{selectedDuplicates.length}</Badge>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            {sortedFiltered.length} {sortedFiltered.length === 1 ? 'ação encontrada' : 'ações encontradas'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <Table className="w-full table-fixed text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] px-2">
                    <Checkbox
                      checked={(() => {
                        const dups = sortedFiltered.filter(isDuplicate);
                        return dups.length > 0 && dups.every((a) => selectedIds.has(a.id));
                      })()}
                      onCheckedChange={(checked) => {
                        const dups = sortedFiltered.filter(isDuplicate);
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (checked) dups.forEach((a) => next.add(a.id));
                          else dups.forEach((a) => next.delete(a.id));
                          return next;
                        });
                      }}
                      aria-label="Selecionar todas repetidas visíveis"
                    />
                  </TableHead>
                  {orderedCols.map((col, idx) => (
                    <SortableTableHead key={col.key} sortKey={col.key} currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}
                      draggable isDragging={dragIndex === idx} isOver={overIndex === idx}
                      onDragStartCol={() => onDragStart(idx)} onDragOverCol={() => onDragOver(idx)} onDragEndCol={onDragEnd}
                      className={`${widthFor(col.key)} px-2`}
                    >{col.label}</SortableTableHead>
                  ))}
                  <TableHead className="text-right px-2 w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map((acao) => (
                  <TableRow key={acao.id} className={selectedIds.has(acao.id) ? 'bg-warning/5' : ''}>
                    <TableCell className="py-2 px-2 align-middle">
                      <Checkbox
                        checked={selectedIds.has(acao.id)}
                        disabled={!isDuplicate(acao)}
                        onCheckedChange={() => toggleSelect(acao.id)}
                        aria-label="Selecionar ação repetida"
                      />
                    </TableCell>
                    {orderedCols.map((col) => renderAcaoCell(col.key, acao))}
                    <TableCell className="py-2 px-2 align-middle">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(acao)} title="Visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(acao)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(acao.id)} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
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
                <Label>Área</Label>
                {isReadOnly ? <Input value={formData.area} readOnly /> : (
                  <SearchableSelect value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })} options={areasSelectOptions} placeholder="Selecione a área" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta</Label>
              <Input value={formData.meta} onChange={(e) => setFormData({ ...formData, meta: e.target.value })} readOnly={isReadOnly} placeholder="Meta associada" />
            </div>
            <div className="space-y-2">
              <Label>Responsáveis *</Label>
              <MultiSelectCombo
                value={formData.responsavel}
                onChange={(v) => setFormData({ ...formData, responsavel: v })}
                options={usuariosOptions}
                placeholder="Selecione um ou mais responsáveis"
                readOnly={isReadOnly}
                allowCreate
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Setores</Label>
                <MultiSelectCombo
                  value={formData.setores}
                  onChange={(v) => setFormData({ ...formData, setores: v })}
                  options={setoresOptions}
                  placeholder="Selecione um ou mais setores"
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

      <AlertDialog open={groupConfirmOpen} onOpenChange={setGroupConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Agrupar ações repetidas</AlertDialogTitle>
            <AlertDialogDescription>
              Serão mescladas {selectedDuplicates.length} ações em {groupableGroups.length} grupo(s).
              A primeira ação de cada grupo será mantida (com responsáveis, setores e área mesclados) e as outras {totalToRemove} ações repetidas serão excluídas. Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={grouping}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGroupSelected} disabled={grouping}>
              {grouping ? 'Agrupando...' : 'Agrupar e excluir repetidas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
