import { useState } from 'react';
import { setoresData as initialSetores, type Setor } from '@/lib/mockData';
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
import { Building2, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const emptySetor: Omit<Setor, 'id'> = {
  nome: '',
  sigla: '',
  tipo: 'departamento',
  descricao: '',
  ativo: true,
};

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>(initialSetores);
  return { setores, setSetores };
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
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Setor, 'id'>>(emptySetor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleSave = () => {
    if (!formData.nome || !formData.sigla) { toast.error('Preencha nome e sigla.'); return; }
    if (dialogMode === 'create') {
      setSetores((prev) => [...prev, { ...formData, id: crypto.randomUUID() }]);
      toast.success('Setor cadastrado com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      setSetores((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...formData } : s)));
      toast.success('Setor atualizado com sucesso!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { setSetores((prev) => prev.filter((s) => s.id !== deleteId)); toast.success('Setor excluído!'); setDeleteId(null); }
  };

  const isReadOnly = dialogMode === 'view';
  const tipoLabels: Record<string, string> = { departamento: 'Departamento', coordenacao: 'Coordenação', setor: 'Setor' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Setores</h2>
          <p className="text-sm text-muted-foreground mt-1">Departamentos e Coordenações da instituição</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Novo Setor</Button>
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
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
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
              <Button onClick={handleSave}>{dialogMode === 'create' ? 'Cadastrar' : 'Salvar'}</Button>
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
