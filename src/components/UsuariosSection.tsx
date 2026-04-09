import { useState, useEffect, useCallback } from 'react';
import { tipoUsuarioLabels, type Usuario, type Setor } from '@/lib/mockData';
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
import { UserCog, Plus, Eye, Pencil, Trash2, Search, Upload, Loader2 } from 'lucide-react';
import { useSortable } from '@/hooks/use-sortable';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useColumnOrder, type ColumnDef } from '@/hooks/use-column-order';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const emptyUsuario: Omit<Usuario, 'id'> = {
  nome: '',
  email: '',
  cargo: '',
  departamento: '',
  tipoUsuario: 'coordenador',
  ativo: true,
};

const tipoUsuarioOptions = [
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'admin_cpa', label: 'Admin CPA' },
];

interface UsuariosSectionProps {
  setores: Setor[];
}

const UsuariosSection = ({ setores }: UsuariosSectionProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Usuario, 'id'>>(emptyUsuario);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    const { data, error } = await supabase.from('usuarios_cpa').select('*').order('nome');
    if (error) { toast.error('Erro ao carregar coordenadores.'); return; }
    setUsuarios(data.map((u) => ({
      id: u.id, nome: u.nome, email: u.email, cargo: u.cargo || '', departamento: u.departamento || '',
      tipoUsuario: u.tipo_usuario, ativo: u.ativo,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const setoresAtivos = setores.filter((s) => s.ativo);
  const depts = [...new Set(usuarios.map((u) => u.departamento))];

  const filterTipoOptions = [{ value: 'all', label: 'Todos os tipos' }, ...tipoUsuarioOptions];
  const filterDeptOptions = [{ value: 'all', label: 'Todos os departamentos' }, ...depts.map((d) => ({ value: d, label: d }))];
  const deptFormOptions = setoresAtivos.map((s) => ({ value: s.nome, label: `${s.nome} (${s.sigla})` }));

  const filtered = usuarios.filter((u) => {
    if (filterTipo !== 'all' && u.tipoUsuario !== filterTipo) return false;
    if (filterDept !== 'all' && u.departamento !== filterDept) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!u.nome.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term) && !u.cargo.toLowerCase().includes(term) && !u.departamento.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const { sorted: sortedFiltered, sortConfig, requestSort } = useSortable(filtered);

  const openCreate = () => { setFormData(emptyUsuario); setEditingId(null); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (u: Usuario) => { setFormData({ nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento, tipoUsuario: u.tipoUsuario, ativo: u.ativo }); setEditingId(u.id); setDialogMode('edit'); setDialogOpen(true); };
  const openView = (u: Usuario) => { setFormData({ nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento, tipoUsuario: u.tipoUsuario, ativo: u.ativo }); setEditingId(u.id); setDialogMode('view'); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.departamento) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    setSaving(true);
    const payload = { nome: formData.nome, email: formData.email, cargo: formData.cargo || null, departamento: formData.departamento, tipo_usuario: formData.tipoUsuario, ativo: formData.ativo };
    if (dialogMode === 'create') {
      const { error } = await supabase.from('usuarios_cpa').insert(payload);
      if (error) { toast.error('Erro ao cadastrar.'); setSaving(false); return; }
      toast.success('Coordenador/Gestor cadastrado com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      const { error } = await supabase.from('usuarios_cpa').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar.'); setSaving(false); return; }
      toast.success('Dados atualizados com sucesso!');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchUsuarios();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('usuarios_cpa').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Registro excluído!');
    setDeleteId(null);
    fetchUsuarios();
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
        const toInsert = rows.map((r) => {
          const tipoRaw = String(r['TIPO'] || r['Tipo'] || r['tipo'] || '').toLowerCase();
          return {
            nome: String(r['NOME'] || r['Nome'] || r['nome'] || ''),
            email: String(r['EMAIL'] || r['Email'] || r['email'] || r['E-MAIL'] || r['E-mail'] || ''),
            cargo: String(r['CARGO'] || r['Cargo'] || r['cargo'] || '') || null,
            departamento: String(r['DEPARTAMENTO'] || r['Departamento'] || r['departamento'] || r['COORDENAÇÃO'] || r['Coordenação'] || ''),
            tipo_usuario: (['coordenador', 'gestor', 'admin_cpa'].includes(tipoRaw) ? tipoRaw : 'coordenador') as 'coordenador' | 'gestor' | 'admin_cpa',
            ativo: true,
          };
        }).filter((u) => u.nome && u.email);
        if (!toInsert.length) { toast.error('Nenhum registro válido.'); return; }
        const { error } = await supabase.from('usuarios_cpa').insert(toInsert);
        if (error) { toast.error('Erro ao importar.'); return; }
        toast.success(`${toInsert.length} coordenadores/gestores importados!`);
        fetchUsuarios();
      } catch { toast.error('Erro ao ler o arquivo.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const isReadOnly = dialogMode === 'view';
  const dialogTitle = dialogMode === 'create' ? 'Novo Cadastro' : dialogMode === 'edit' ? 'Editar Cadastro' : 'Detalhes do Cadastro';

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Coordenadores & Gestores</h2>
          <p className="text-sm text-muted-foreground mt-1">Cadastro de membros vinculados à CPA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-usuarios')?.click()}>
            <Upload className="w-4 h-4" />Importar
          </Button>
          <input id="import-usuarios" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Novo Cadastro</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar coordenadores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <SearchableSelect value={filterTipo} onValueChange={setFilterTipo} options={filterTipoOptions} placeholder="Filtrar por tipo" className="w-[200px]" />
        <SearchableSelect value={filterDept} onValueChange={setFilterDept} options={filterDeptOptions} placeholder="Filtrar por departamento" className="w-[200px]" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            {sortedFiltered.length} {sortedFiltered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="nome" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Nome</SortableTableHead>
                  <SortableTableHead sortKey="email" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>E-mail</SortableTableHead>
                  <SortableTableHead sortKey="cargo" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Cargo</SortableTableHead>
                  <SortableTableHead sortKey="departamento" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Departamento</SortableTableHead>
                  <SortableTableHead sortKey="tipoUsuario" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Tipo</SortableTableHead>
                  <SortableTableHead sortKey="ativo" currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}>Status</SortableTableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.cargo}</TableCell>
                    <TableCell className="text-sm">{u.departamento}</TableCell>
                    <TableCell><Badge variant="secondary">{tipoUsuarioLabels[u.tipoUsuario]}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? 'default' : 'outline'} className={u.ativo ? 'bg-success/10 text-success' : ''}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(u)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <DialogDescription>{dialogMode === 'create' ? 'Cadastre um novo coordenador ou gestor.' : dialogMode === 'edit' ? 'Altere os dados do cadastro.' : 'Detalhes completos do cadastro.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} readOnly={isReadOnly} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} readOnly={isReadOnly} placeholder="email@instituicao.edu.br" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} readOnly={isReadOnly} placeholder="Ex: Coordenador de Curso" />
              </div>
              <div className="space-y-2">
                <Label>Departamento / Coordenação *</Label>
                {isReadOnly ? <Input value={formData.departamento} readOnly /> : (
                  <SearchableSelect value={formData.departamento} onValueChange={(v) => setFormData({ ...formData, departamento: v })} options={deptFormOptions} placeholder="Selecione" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                {isReadOnly ? <Input value={tipoUsuarioLabels[formData.tipoUsuario]} readOnly /> : (
                  <SearchableSelect value={formData.tipoUsuario} onValueChange={(v) => setFormData({ ...formData, tipoUsuario: v as Usuario['tipoUsuario'] })} options={tipoUsuarioOptions} />
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
          </div>
          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{dialogMode === 'create' ? 'Cadastrar' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Cadastro</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este cadastro? Esta operação não pode ser desfeita.</AlertDialogDescription>
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

export default UsuariosSection;
