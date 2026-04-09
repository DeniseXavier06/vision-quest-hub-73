import { useState } from 'react';
import { usuariosData as initialUsuarios, tipoUsuarioLabels, type Usuario } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { UserCog, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyUsuario: Omit<Usuario, 'id'> = {
  nome: '',
  email: '',
  cargo: '',
  departamento: '',
  tipoUsuario: 'coordenador',
  ativo: true,
};

const departamentos = [
  'Administração',
  'Engenharia',
  'Pedagogia',
  'TI',
  'Infraestrutura',
  'Ciências Humanas',
  'Ciências Exatas',
  'Saúde',
  'Direito',
];

const UsuariosSection = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Omit<Usuario, 'id'>>(emptyUsuario);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const depts = [...new Set(usuarios.map((u) => u.departamento))];

  const filtered = usuarios.filter((u) => {
    if (filterTipo !== 'all' && u.tipoUsuario !== filterTipo) return false;
    if (filterDept !== 'all' && u.departamento !== filterDept) return false;
    return true;
  });

  const openCreate = () => {
    setFormData(emptyUsuario);
    setEditingId(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setFormData({ nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento, tipoUsuario: u.tipoUsuario, ativo: u.ativo });
    setEditingId(u.id);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const openView = (u: Usuario) => {
    setFormData({ nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento, tipoUsuario: u.tipoUsuario, ativo: u.ativo });
    setEditingId(u.id);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email || !formData.departamento) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (dialogMode === 'create') {
      setUsuarios((prev) => [...prev, { ...formData, id: crypto.randomUUID() }]);
      toast.success('Coordenador/Gestor cadastrado com sucesso!');
    } else if (dialogMode === 'edit' && editingId) {
      setUsuarios((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...formData } : u)));
      toast.success('Dados atualizados com sucesso!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setUsuarios((prev) => prev.filter((u) => u.id !== deleteId));
      toast.success('Registro excluído com sucesso!');
      setDeleteId(null);
    }
  };

  const isReadOnly = dialogMode === 'view';
  const dialogTitle = dialogMode === 'create' ? 'Novo Cadastro' : dialogMode === 'edit' ? 'Editar Cadastro' : 'Detalhes do Cadastro';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Coordenadores & Gestores</h2>
          <p className="text-sm text-muted-foreground mt-1">Cadastro de membros vinculados à CPA</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cadastro
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="coordenador">Coordenador</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="admin_cpa">Admin CPA</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os departamentos</SelectItem>
            {depts.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.cargo}</TableCell>
                    <TableCell className="text-sm">{u.departamento}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tipoUsuarioLabels[u.tipoUsuario]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? 'default' : 'outline'} className={u.ativo ? 'bg-success/10 text-success' : ''}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(u)} title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)} title="Excluir">
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
              {dialogMode === 'create' ? 'Cadastre um novo coordenador ou gestor.' : dialogMode === 'edit' ? 'Altere os dados do cadastro.' : 'Detalhes completos do cadastro.'}
            </DialogDescription>
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
                {isReadOnly ? (
                  <Input value={formData.departamento} readOnly />
                ) : (
                  <Select value={formData.departamento} onValueChange={(v) => setFormData({ ...formData, departamento: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {departamentos.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                {isReadOnly ? (
                  <Input value={tipoUsuarioLabels[formData.tipoUsuario]} readOnly />
                ) : (
                  <Select value={formData.tipoUsuario} onValueChange={(v) => setFormData({ ...formData, tipoUsuario: v as Usuario['tipoUsuario'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="admin_cpa">Admin CPA</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button onClick={handleSave}>
                {dialogMode === 'create' ? 'Cadastrar' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Cadastro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cadastro? Esta operação não pode ser desfeita.
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

export default UsuariosSection;
