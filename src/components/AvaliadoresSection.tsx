import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AvaliadoresSection = () => {
  const [avaliadores, setAvaliadores] = useState<any[]>([]);
  const [semestres, setSemestres] = useState<any[]>([]);
  const [filtroSemestre, setFiltroSemestre] = useState('__all__');
  const [filtroNivel, setFiltroNivel] = useState('__all__');
  const [filtroCurso, setFiltroCurso] = useState('__all__');
  const [filtroPeriodo, setFiltroPeriodo] = useState('__all__');
  const [filtroTurma, setFiltroTurma] = useState('__all__');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('semestres_letivos').select('*').order('ano', { ascending: false }).order('periodo', { ascending: false })
      .then(({ data }) => { if (data) setSemestres(data); });
  }, []);

  const [respostasPorSessao, setRespostasPorSessao] = useState<Record<string, Set<string>>>({});
  const [dimensoesPorAmbiente, setDimensoesPorAmbiente] = useState<Record<string, number>>({});

  const fetchAvaliadores = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('avaliadores_sessao').select('*').order('nome');
    if (filtroSemestre !== '__all__') query = query.eq('semestre', filtroSemestre);
    if (filtroNivel !== '__all__') query = query.ilike('nivel', filtroNivel);
    if (filtroCurso !== '__all__') query = query.eq('curso', filtroCurso);
    if (filtroPeriodo !== '__all__') query = query.eq('periodo', filtroPeriodo);
    if (filtroTurma !== '__all__') query = query.eq('codigo_turma', filtroTurma);
    if (busca.trim()) query = query.or(`nome.ilike.%${busca.trim()}%,matricula.ilike.%${busca.trim()}%,email.ilike.%${busca.trim()}%`);
    const { data } = await query;
    if (data) {
      setAvaliadores(data);

      // Fetch respostas for these avaliadores (distinct dimensoes per sessao)
      const sessaoIds = data.map(a => a.id);
      if (sessaoIds.length > 0) {
        const { data: respostas } = await supabase
          .from('respostas_avaliacao')
          .select('sessao_id, dimensao_id')
          .in('sessao_id', sessaoIds);
        const map: Record<string, Set<string>> = {};
        respostas?.forEach(r => {
          if (!map[r.sessao_id]) map[r.sessao_id] = new Set();
          map[r.sessao_id].add(r.dimensao_id);
        });
        setRespostasPorSessao(map);
      }

      // Fetch dimensoes count per ambiente
      const ambienteIds = [...new Set(data.map(a => a.ambiente_id))];
      if (ambienteIds.length > 0) {
        const { data: ambDims } = await supabase
          .from('ambiente_dimensoes')
          .select('ambiente_id, dimensao_id')
          .in('ambiente_id', ambienteIds);
        const dimMap: Record<string, number> = {};
        ambDims?.forEach(ad => {
          dimMap[ad.ambiente_id] = (dimMap[ad.ambiente_id] || 0) + 1;
        });
        setDimensoesPorAmbiente(dimMap);
      }
    }
    setLoading(false);
  }, [filtroSemestre, filtroNivel, filtroCurso, filtroPeriodo, filtroTurma, busca]);

  const getStatus = (avaliador: any) => {
    const totalDims = dimensoesPorAmbiente[avaliador.ambiente_id] || 0;
    const respondidas = respostasPorSessao[avaliador.id]?.size || 0;
    if (avaliador.completado || (totalDims > 0 && respondidas >= totalDims)) return 'Realizado';
    if (respondidas > 0) return 'Em Progresso';
    return 'Não Realizado';
  };

  const getStatusVariant = (status: string) => {
    if (status === 'Realizado') return 'default' as const;
    if (status === 'Em Progresso') return 'secondary' as const;
    return 'outline' as const;
  };

  useEffect(() => { fetchAvaliadores(); }, [fetchAvaliadores]);

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    const { id, created_at, token, completado, ambiente_id, ...updateData } = editItem;
    const { error } = await supabase.from('avaliadores_sessao').update(updateData).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliador atualizado com sucesso' });
      setEditItem(null);
      fetchAvaliadores();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const { error } = await supabase.from('avaliadores_sessao').delete().eq('id', deleteItem.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliador excluído com sucesso' });
      setDeleteItem(null);
      fetchAvaliadores();
    }
    setSaving(false);
  };

  const fields = [
    { key: 'matricula', label: 'Matrícula' },
    { key: 'nome', label: 'Nome' },
    { key: 'cpf', label: 'CPF' },
    { key: 'nivel', label: 'Nível' },
    { key: 'semestre', label: 'Semestre' },
    { key: 'curso', label: 'Curso' },
    { key: 'periodo', label: 'Período' },
    { key: 'codigo_turma', label: 'Cód. Turma' },
    { key: 'email', label: 'Email' },
    { key: 'perfil', label: 'Perfil' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Avaliadores</h2>
        <p className="text-muted-foreground text-sm mt-1">Pessoas importadas para avaliação</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-56">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
              <Input placeholder="Nome, matrícula ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semestre</label>
              <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {semestres.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível</label>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="ead">EAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Avaliadores
            <Badge variant="secondary" className="ml-auto">{avaliadores.length} registro(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Semestre</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Cód. Turma</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : avaliadores.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Nenhum avaliador encontrado</TableCell></TableRow>
                ) : (
                  avaliadores.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.matricula}</TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-xs">{a.cpf || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{a.nivel || '—'}</Badge></TableCell>
                      <TableCell className="text-xs">{a.semestre || '—'}</TableCell>
                      <TableCell className="text-xs">{a.curso || '—'}</TableCell>
                      <TableCell className="text-xs">{a.periodo || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.codigo_turma || '—'}</TableCell>
                      <TableCell className="text-xs">{a.email || '—'}</TableCell>
                      <TableCell>
                        {(() => {
                          const status = getStatus(a);
                          return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(a)} title="Visualizar">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem({ ...a })} title="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteItem(a)} title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Avaliador</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f.key} className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{f.label}</span>
                  <span>{viewItem[f.key] || '—'}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Status</span>
                {(() => {
                  const status = getStatus(viewItem);
                  return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Avaliador</DialogTitle></DialogHeader>
          {editItem && (
            <div className="grid grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key} className={f.key === 'email' ? 'col-span-2' : ''}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={editItem[f.key] || ''}
                    onChange={(e) => setEditItem({ ...editItem, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir o avaliador <strong>{deleteItem?.nome}</strong> (matrícula: {deleteItem?.matricula})?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvaliadoresSection;
