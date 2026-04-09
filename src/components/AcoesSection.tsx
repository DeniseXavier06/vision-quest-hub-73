import { useState, useCallback } from 'react';
import { acoesData as initialAcoes, statusLabels, type Acao } from '@/lib/mockData';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ListChecks, Plus, Eye, Pencil, Trash2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const statusColors: Record<string, string> = {
  nao_iniciada: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-info/10 text-info',
  concluida: 'bg-success/10 text-success',
};

const emptyAcao: Omit<Acao, 'id' | 'diasRestantes'> = {
  nome: '', eixo: '', meta: '', responsavel: '', status: 'nao_iniciada', percentualProgresso: 0, prazo: '',
};

const eixosOptions = [
  'Planejamento e Avaliação', 'Políticas Acadêmicas', 'Políticas de Gestão',
  'Infraestrutura', 'Valorização Profissional', 'Imagem Institucional',
  'Ambiente Virtual Aprendizagem', 'Avaliando a Infraestrutura', 'Avaliando a Valorização Profissional',
  'Avaliando a Comunicação', 'Avaliando os Serviços', 'Avaliando a Gestão',
];

const eixosSelectOptions = eixosOptions.map((e) => ({ value: e, label: e }));
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
  // Try DD/MM/YYYY format
  const parts = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.substring(0, 10);
  return '';
}

function parseProgress(val: unknown): number {
  if (val == null || val === '') return 0;
  const n = Number(String(val).replace('%', '').replace(',', '.'));
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
}

const AcoesSection = () => {
  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [filterEixo, setFilterEixo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Acao, 'id' | 'diasRestantes'>>(emptyAcao);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const eixos = [...new Set(acoes.map((a) => a.eixo))];
  const filterEixoOptions = [{ value: 'all', label: 'Todos os eixos' }, ...eixos.map((e) => ({ value: e, label: e }))];
  const filterStatusOptions = [{ value: 'all', label: 'Todos os status' }, ...statusSelectOptions];

  const filtered = acoes.filter((a) => {
    if (filterEixo !== 'all' && a.eixo !== filterEixo) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!a.nome.toLowerCase().includes(term) && !a.responsavel.toLowerCase().includes(term) && !a.eixo.toLowerCase().includes(term) && !a.meta.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const calcDiasRestantes = (prazo: string) => {
    const diff = new Date(prazo).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const openCreate = () => { setFormData(emptyAcao); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (acao: Acao) => {
    setFormData({ nome: acao.nome, eixo: acao.eixo, meta: acao.meta, responsavel: acao.responsavel, status: acao.status, percentualProgresso: acao.percentualProgresso, prazo: acao.prazo });
    setEditingId(acao.id); setDialogMode('edit'); setDialogOpen(true);
  };
  const openView = (acao: Acao) => {
    setFormData({ nome: acao.nome, eixo: acao.eixo, meta: acao.meta, responsavel: acao.responsavel, status: acao.status, percentualProgresso: acao.percentualProgresso, prazo: acao.prazo });
    setEditingId(acao.id); setDialogMode('view'); setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.eixo || !formData.responsavel || !formData.prazo) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    if (dialogMode === 'create') {
      setAcoes((prev) => [...prev, { ...formData, id: crypto.randomUUID(), diasRestantes: calcDiasRestantes(formData.prazo) }]);
      toast.success('Ação criada com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      setAcoes((prev) => prev.map((a) => a.id === editingId ? { ...a, ...formData, diasRestantes: calcDiasRestantes(formData.prazo) } : a));
      toast.success('Ação atualizada com sucesso!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { setAcoes((prev) => prev.filter((a) => a.id !== deleteId)); toast.success('Ação excluída com sucesso!'); setDeleteId(null); }
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    try {
      const newAcoes: Acao[] = [];
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        for (const row of json) {
          // Get the action text from various possible column names
          const acao = String(
            row['Ação'] ?? row['ACAO'] ?? row['ação'] ??
            // Handle the long column header from Presenciais CSV
            Object.entries(row).find(([key]) => key.startsWith('•') || key.includes('Realizar verificação'))?.[1] ??
            ''
          ).trim();

          if (!acao) continue; // Skip rows without an action

          const responsavel = String(row['Responsável'] ?? row['RESPONSAVEL'] ?? row['responsavel'] ?? '').trim();
          const area = String(row['Área'] ?? row['AREA'] ?? row['Area'] ?? row['área'] ?? '').trim();
          const dimensao = String(row['DIMENSAO'] ?? row['Dimensão'] ?? row['dimensao'] ?? '').trim();
          const curso = String(row['NOME_CURSO'] ?? row['nome_curso'] ?? '').trim();
          const questao = String(row['TEXTO_QUESTAO'] ?? row['QUESTÃO'] ?? row['texto_questao'] ?? '').trim();
          const prazoRaw = String(row['Prazo'] ?? row['PRAZO'] ?? row['prazo'] ?? '');
          const statusRaw = String(row['Status'] ?? row['STATUS'] ?? row['status'] ?? '');
          const progressRaw = row['% Progresso'] ?? row['%_PROGRESSO'] ?? row['progresso'] ?? 0;
          const prioridadeRaw = String(row['Prioridade'] ?? row['PRIORIDADE'] ?? '');

          const eixo = area || dimensao || 'Sem Eixo';
          const meta = curso ? `${curso}${questao ? ' - ' + questao : ''}` : questao || '';

          newAcoes.push({
            id: crypto.randomUUID(),
            nome: acao,
            eixo,
            meta,
            responsavel: responsavel || 'Não informado',
            status: parseStatus(statusRaw),
            percentualProgresso: parseProgress(progressRaw),
            prazo: parsePrazo(prazoRaw) || new Date().toISOString().slice(0, 10),
            diasRestantes: 0,
          });
        }
      }

      // Calculate dias restantes
      newAcoes.forEach((a) => { a.diasRestantes = calcDiasRestantes(a.prazo); });

      setAcoes((prev) => [...prev, ...newAcoes]);
      toast.success(`${newAcoes.length} ações importadas de ${files.length} arquivo(s)!`);
    } catch (err) {
      toast.error('Erro ao importar. Verifique o formato do arquivo.');
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }, []);

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
        <SearchableSelect value={filterEixo} onValueChange={setFilterEixo} options={filterEixoOptions} placeholder="Filtrar por eixo" className="w-[220px]" />
        <SearchableSelect value={filterStatus} onValueChange={setFilterStatus} options={filterStatusOptions} placeholder="Filtrar por status" className="w-[180px]" />
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
                    <TableCell className="text-sm">{new Date(acao.prazo).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[acao.status]} variant="secondary">{statusLabels[acao.status]}</Badge>
                    </TableCell>
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
                <Label>Eixo *</Label>
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
                <Label>Responsável *</Label>
                <Input value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} readOnly={isReadOnly} placeholder="Nome do responsável" />
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
                  <SearchableSelect value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Acao['status'] })} options={statusSelectOptions} />
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
