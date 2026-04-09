import { useState, useEffect, useCallback } from 'react';
import { type Setor } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus, Eye, Pencil, Trash2, Search, Upload, Loader2 } from 'lucide-react';
import { useSortable } from '@/hooks/use-sortable';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const emptySetor: Omit<Setor, 'id'> = {
  nome: '',
  sigla: '',
  tipo: 'departamento',
  descricao: '',
  ativo: true,
};

const tipoOptions = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'coordenacao', label: 'Coordenação' },
  { value: 'setor', label: 'Setor' },
];

interface SetoresSectionProps {
  setores: Setor[];
  setSetores: React.Dispatch<React.SetStateAction<Setor[]>>;
}

const SetoresSection = ({ setores, setSetores }: SetoresSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Setor, 'id'>>(emptySetor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSetores = useCallback(async () => {
    const { data, error } = await supabase.from('setores').select('*').order('nome');
    if (error) { toast.error('Erro ao carregar setores.'); return; }
    setSetores(data.map((s) => ({ id: s.id, nome: s.nome, sigla: s.sigla, tipo: s.tipo, descricao: s.descricao || '', ativo: s.ativo })));
    setLoading(false);
  }, [setSetores]);

  useEffect(() => { fetchSetores(); }, [fetchSetores]);

  const filterTipoOptions = [{ value: 'all', label: 'Todos os tipos' }, ...tipoOptions];

  const filtered = setores.filter((s) => {
    if (filterTipo !== 'all' && s.tipo !== filterTipo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!s.nome.toLowerCase().includes(term) && !s.sigla.toLowerCase().includes(term) && !s.descricao.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const openCreate = () => { setFormData(emptySetor); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (s: Setor) => { setFormData({ nome: s.nome, sigla: s.sigla, tipo: s.tipo, descricao: s.descricao, ativo: s.ativo }); setEditingId(s.id); setDialogMode('edit'); setDialogOpen(true); };
  const openView = (s: Setor) => { setFormData({ nome: s.nome, sigla: s.sigla, tipo: s.tipo, descricao: s.descricao, ativo: s.ativo }); setEditingId(s.id); setDialogMode('view'); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formData.nome || !formData.sigla) { toast.error('Preencha nome e sigla.'); return; }
    setSaving(true);
    if (dialogMode === 'create') {
      const { error } = await supabase.from('setores').insert({ nome: formData.nome, sigla: formData.sigla, tipo: formData.tipo, descricao: formData.descricao || null, ativo: formData.ativo });
      if (error) { toast.error('Erro ao cadastrar.'); setSaving(false); return; }
      toast.success('Setor cadastrado com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      const { error } = await supabase.from('setores').update({ nome: formData.nome, sigla: formData.sigla, tipo: formData.tipo, descricao: formData.descricao || null, ativo: formData.ativo }).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar.'); setSaving(false); return; }
      toast.success('Setor atualizado com sucesso!');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchSetores();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('setores').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Setor excluído!');
    setDeleteId(null);
    fetchSetores();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        if (!rows.length) { toast.error('Arquivo vazio.'); return; }
        const tipoMap: Record<string, Setor['tipo']> = { departamento: 'departamento', 'coordenação': 'coordenacao', coordenacao: 'coordenacao', setor: 'setor' };
        const toInsert = rows.map((r) => ({
          nome: String(r['NOME'] || r['Nome'] || r['nome'] || ''),
          sigla: String(r['SIGLA'] || r['Sigla'] || r['sigla'] || ''),
          tipo: tipoMap[String(r['TIPO'] || r['Tipo'] || r['tipo'] || '').toLowerCase()] || 'departamento' as const,
          descricao: String(r['DESCRIÇÃO'] || r['Descrição'] || r['DESCRICAO'] || r['descricao'] || '') || null,
          ativo: true,
        })).filter((s) => s.nome && s.sigla);
        if (!toInsert.length) { toast.error('Nenhum registro válido encontrado.'); return; }
        const { error } = await supabase.from('setores').insert(toInsert);
        if (error) { toast.error('Erro ao importar.'); return; }
        toast.success(`${toInsert.length} setores importados!`);
        fetchSetores();
      } catch { toast.error('Erro ao ler o arquivo.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const isReadOnly = dialogMode === 'view';
  const tipoLabels: Record<string, string> = { departamento: 'Departamento', coordenacao: 'Coordenação', setor: 'Setor' };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Setores</h2>
          <p className="text-sm text-muted-foreground mt-1">Departamentos e Coordenações da instituição</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-setores')?.click()}>
            <Upload className="w-4 h-4" />Importar
          </Button>
          <input id="import-setores" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Novo Setor</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar setores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <SearchableSelect value={filterTipo} onValueChange={setFilterTipo} options={filterTipoOptions} placeholder="Filtrar por tipo" className="w-[200px]" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {sortedFiltered.length} {sortedFiltered.length === 1 ? 'registro' : 'registros'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="nome" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Nome</SortableTableHead>
                  <SortableTableHead sortKey="sigla" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Sigla</SortableTableHead>
                  <SortableTableHead sortKey="tipo" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Tipo</SortableTableHead>
                  <SortableTableHead sortKey="ativo" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Status</SortableTableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell><Badge variant="outline">{s.sigla}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{tipoLabels[s.tipo]}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={s.ativo ? 'default' : 'outline'} className={s.ativo ? 'bg-success/10 text-success' : ''}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(s)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialogMode === 'create' ? 'Novo Setor' : dialogMode === 'edit' ? 'Editar Setor' : 'Detalhes do Setor'}</DialogTitle>
            <DialogDescription>{dialogMode === 'create' ? 'Cadastre um novo setor.' : dialogMode === 'edit' ? 'Altere os dados.' : 'Detalhes completos.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} readOnly={isReadOnly} placeholder="Ex: Engenharia Civil" />
              </div>
              <div className="space-y-2">
                <Label>Sigla *</Label>
                <Input value={formData.sigla} onChange={(e) => setFormData({ ...formData, sigla: e.target.value })} readOnly={isReadOnly} placeholder="Ex: ENG" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                {isReadOnly ? <Input value={tipoLabels[formData.tipo]} readOnly /> : (
                  <SearchableSelect value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as Setor['tipo'] })} options={tipoOptions} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Ativo</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={formData.ativo} onCheckedChange={(v) => setFormData({ ...formData, ativo: v })} disabled={isReadOnly} />
                  <span className="text-sm text-muted-foreground">{formData.ativo ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} readOnly={isReadOnly} placeholder="Descrição do setor..." rows={3} />
            </div>
          </div>
          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{dialogMode === 'create' ? 'Cadastrar' : 'Salvar'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta operação não pode ser desfeita.</AlertDialogDescription>
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

export default SetoresSection;
