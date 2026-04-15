import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, ChevronDown, ChevronRight,
  Calendar, Upload, FileSpreadsheet, ArrowRight,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Semestre = Tables<'semestres_letivos'>;
type Dimensao = Tables<'dimensoes_avaliacao'>;
type Area = Tables<'areas_avaliacao'>;
type Questao = Tables<'questoes_avaliacao'>;
type Ambiente = Tables<'ambientes_avaliacao'>;

const PERFIS = ['professor', 'aluno', 'colaborador', 'coordenador'] as const;
const PERFIL_LABELS: Record<string, string> = { professor: 'Professor', aluno: 'Aluno', colaborador: 'Colaborador', coordenador: 'Coordenador' };
const NIVEL_LABELS: Record<string, string> = { presencial: 'Presencial', ead: 'EAD' };
const CAMPOS_SISTEMA_POR_PERFIL: Record<string, string[]> = {
  aluno: ['matricula', 'nome', 'semestre', 'curso', 'periodo', 'codigo_turma', 'nivel', 'email'],
  professor: ['matricula', 'nome', 'curso', 'periodo', 'disciplinas', 'setor', 'email', 'cpf'],
  colaborador: ['matricula', 'nome', 'setor', 'email', 'cpf', 'centro'],
  coordenador: ['matricula', 'nome', 'curso', 'email', 'cpf'],
};
const CAMPOS_SISTEMA_DEFAULT = ['matricula', 'nome', 'curso', 'periodo', 'email'];

// ─── Semestres Tab ───
const SemestresTab = () => {
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [form, setForm] = useState({ ano: new Date().getFullYear(), periodo: 1 });
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('semestres_letivos').select('*').order('ano', { ascending: false }).order('periodo', { ascending: false });
    if (data) setSemestres(data);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async () => {
    const nome = `${form.ano}.${form.periodo}`;
    setLoading(true);
    const { error } = await supabase.from('semestres_letivos').insert({ nome, ano: form.ano, periodo: form.periodo });
    setLoading(false);
    if (error) { toast.error('Erro ao criar semestre'); return; }
    toast.success('Semestre criado');
    fetch();
  };

  const toggle = async (s: Semestre) => {
    await supabase.from('semestres_letivos').update({ ativo: !s.ativo }).eq('id', s.id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('semestres_letivos').delete().eq('id', id);
    toast.success('Semestre removido');
    fetch();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Novo Semestre Letivo</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div>
            <Label>Ano</Label>
            <Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: +e.target.value })} className="w-28" />
          </div>
          <div>
            <Label>Período</Label>
            <Select value={String(form.periodo)} onValueChange={(v) => setForm({ ...form, periodo: +v })}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} disabled={loading}><Plus className="w-4 h-4 mr-1" />Criar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Semestres Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {semestres.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum semestre cadastrado.</p> : (
            <div className="space-y-2">
              {semestres.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{s.nome}</span>
                    <Badge variant={s.ativo ? 'default' : 'secondary'}>{s.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggle(s)}>{s.ativo ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Dimensões Tab (com Áreas e Questões) ───
const DimensoesTab = () => {
  const [dimensoes, setDimensoes] = useState<(Dimensao & { areas?: (Area & { questoes?: Questao[] })[] })[]>([]);
  const [formDim, setFormDim] = useState({ nome: '', descricao: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [novaArea, setNovaArea] = useState('');
  const [novaQuestao, setNovaQuestao] = useState('');
  const [editingDim, setEditingDim] = useState<string | null>(null);
  const [editDimForm, setEditDimForm] = useState({ nome: '', descricao: '' });
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editAreaForm, setEditAreaForm] = useState({ nome: '', descricao: '' });
  const [editingQuestao, setEditingQuestao] = useState<string | null>(null);
  const [editQuestaoTexto, setEditQuestaoTexto] = useState('');

  const fetch = useCallback(async () => {
    const { data: dims } = await supabase.from('dimensoes_avaliacao').select('*').order('ordem');
    if (!dims) return;
    const { data: areas } = await supabase.from('areas_avaliacao').select('*').order('ordem');
    const { data: qs } = await supabase.from('questoes_avaliacao').select('*').order('ordem');
    const result = dims.map((d) => ({
      ...d,
      areas: (areas || []).filter((a) => a.dimensao_id === d.id).map((a) => ({
        ...a,
        questoes: (qs || []).filter((q) => q.area_id === a.id),
      })),
    }));
    setDimensoes(result);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Dimensão CRUD
  const addDim = async () => {
    if (!formDim.nome.trim()) return;
    await supabase.from('dimensoes_avaliacao').insert({ nome: formDim.nome, descricao: formDim.descricao, ordem: dimensoes.length });
    setFormDim({ nome: '', descricao: '' });
    toast.success('Dimensão criada');
    fetch();
  };

  const updateDim = async (id: string) => {
    await supabase.from('dimensoes_avaliacao').update({ nome: editDimForm.nome, descricao: editDimForm.descricao }).eq('id', id);
    setEditingDim(null);
    toast.success('Dimensão atualizada');
    fetch();
  };

  const toggleDimAtivo = async (dim: Dimensao) => {
    await supabase.from('dimensoes_avaliacao').update({ ativo: !dim.ativo }).eq('id', dim.id);
    toast.success(dim.ativo ? 'Dimensão desativada' : 'Dimensão ativada');
    fetch();
  };

  const removeDim = async (id: string) => {
    await supabase.from('dimensoes_avaliacao').delete().eq('id', id);
    toast.success('Dimensão removida');
    fetch();
  };

  // Área CRUD
  const addArea = async (dimId: string) => {
    if (!novaArea.trim()) return;
    const dim = dimensoes.find((d) => d.id === dimId);
    const ordem = dim?.areas?.length || 0;
    await supabase.from('areas_avaliacao').insert({ dimensao_id: dimId, nome: novaArea, ordem });
    setNovaArea('');
    toast.success('Área adicionada');
    fetch();
  };

  const updateArea = async (id: string) => {
    await supabase.from('areas_avaliacao').update({ nome: editAreaForm.nome, descricao: editAreaForm.descricao }).eq('id', id);
    setEditingArea(null);
    toast.success('Área atualizada');
    fetch();
  };

  const toggleAreaAtivo = async (area: Area) => {
    await supabase.from('areas_avaliacao').update({ ativo: !area.ativo }).eq('id', area.id);
    toast.success(area.ativo ? 'Área desativada' : 'Área ativada');
    fetch();
  };

  const removeArea = async (id: string) => {
    await supabase.from('areas_avaliacao').delete().eq('id', id);
    toast.success('Área removida');
    fetch();
  };

  // Questão CRUD
  const addQuestao = async (areaId: string, dimId: string) => {
    if (!novaQuestao.trim()) return;
    const dim = dimensoes.find((d) => d.id === dimId);
    const area = dim?.areas?.find((a) => a.id === areaId);
    const ordem = area?.questoes?.length || 0;
    await supabase.from('questoes_avaliacao').insert({ dimensao_id: dimId, area_id: areaId, texto: novaQuestao, ordem });
    setNovaQuestao('');
    toast.success('Questão adicionada');
    fetch();
  };

  const updateQuestao = async (id: string) => {
    if (!editQuestaoTexto.trim()) return;
    await supabase.from('questoes_avaliacao').update({ texto: editQuestaoTexto }).eq('id', id);
    setEditingQuestao(null);
    toast.success('Questão atualizada');
    fetch();
  };

  const toggleQuestaoAtivo = async (q: Questao) => {
    await supabase.from('questoes_avaliacao').update({ ativo: !q.ativo }).eq('id', q.id);
    toast.success(q.ativo ? 'Questão desativada' : 'Questão ativada');
    fetch();
  };

  const removeQuestao = async (id: string) => {
    await supabase.from('questoes_avaliacao').delete().eq('id', id);
    toast.success('Questão removida');
    fetch();
  };

  const totalQuestoesDim = (dim: typeof dimensoes[0]) =>
    dim.areas?.reduce((sum, a) => sum + (a.questoes?.length || 0), 0) || 0;

  const totalQuestoesAtivasDim = (dim: typeof dimensoes[0]) =>
    dim.areas?.reduce((sum, a) => sum + (a.questoes?.filter(q => q.ativo).length || 0), 0) || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Nova Dimensão</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Nome</Label>
              <Input value={formDim.nome} onChange={(e) => setFormDim({ ...formDim, nome: e.target.value })} placeholder="Ex: Qualidade do Ensino" />
            </div>
            <div className="flex-1">
              <Label>Descrição</Label>
              <Input value={formDim.descricao} onChange={(e) => setFormDim({ ...formDim, descricao: e.target.value })} placeholder="Descrição opcional" />
            </div>
          </div>
          <Button onClick={addDim}><Plus className="w-4 h-4 mr-1" />Adicionar Dimensão</Button>
        </CardContent>
      </Card>

      {dimensoes.map((dim) => (
        <Card key={dim.id} className={!dim.ativo ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 text-left" onClick={() => setExpanded(expanded === dim.id ? null : dim.id)}>
                {expanded === dim.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {editingDim === dim.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input value={editDimForm.nome} onChange={(e) => setEditDimForm({ ...editDimForm, nome: e.target.value })} className="h-8 w-48" />
                    <Input value={editDimForm.descricao} onChange={(e) => setEditDimForm({ ...editDimForm, descricao: e.target.value })} className="h-8 w-48" />
                    <Button size="sm" variant="ghost" onClick={() => updateDim(dim.id)}><Save className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDim(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <CardTitle className="text-base">{dim.nome}</CardTitle>
                )}
              </button>
              <div className="flex items-center gap-2">
                <Badge variant={dim.ativo ? 'default' : 'secondary'}>{dim.ativo ? 'Ativa' : 'Inativa'}</Badge>
                <Badge variant="outline">{dim.areas?.length || 0} áreas · {totalQuestoesAtivasDim(dim)}/{totalQuestoesDim(dim)} questões</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleDimAtivo(dim)}>{dim.ativo ? 'Desativar' : 'Ativar'}</Button>
                {editingDim !== dim.id && (
                  <Button size="sm" variant="ghost" onClick={() => { setEditingDim(dim.id); setEditDimForm({ nome: dim.nome, descricao: dim.descricao || '' }); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removeDim(dim.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
            {dim.descricao && editingDim !== dim.id && <p className="text-xs text-muted-foreground ml-6">{dim.descricao}</p>}
          </CardHeader>
          {expanded === dim.id && (
            <CardContent className="pt-0 space-y-3">
              {/* Áreas */}
              {dim.areas?.map((area) => (
                <div key={area.id} className={`border rounded-lg p-3 space-y-2 ${!area.ativo ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-left" onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}>
                      {expandedArea === area.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {editingArea === area.id ? (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input value={editAreaForm.nome} onChange={(e) => setEditAreaForm({ ...editAreaForm, nome: e.target.value })} className="h-7 w-40 text-sm" />
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => updateArea(area.id)}><Save className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingArea(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium">{area.nome}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{area.questoes?.filter(q => q.ativo).length || 0}/{area.questoes?.length || 0} questões</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleAreaAtivo(area)}>
                        {area.ativo ? <X className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                      </Button>
                      {editingArea !== area.id && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingArea(area.id); setEditAreaForm({ nome: area.nome, descricao: area.descricao || '' }); }}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeArea(area.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {expandedArea === area.id && (
                    <div className="space-y-2 ml-5">
                      <p className="text-xs text-muted-foreground">Escala: Muito Ruim → Regular → Atende Parcialmente → Bom → Excelente</p>
                      {area.questoes?.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhuma questão nesta área.</p>}
                      {area.questoes?.map((q, i) => (
                        <div key={q.id} className={`flex items-center gap-2 p-2 rounded bg-muted/30 ${!q.ativo ? 'opacity-50' : ''}`}>
                          {editingQuestao === q.id ? (
                            <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input value={editQuestaoTexto} onChange={(e) => setEditQuestaoTexto(e.target.value)} className="h-8 flex-1" onKeyDown={(e) => e.key === 'Enter' && updateQuestao(q.id)} />
                              <Button size="sm" variant="ghost" onClick={() => updateQuestao(q.id)}><Save className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingQuestao(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <span className="text-sm text-foreground flex-1">{i + 1}. {q.texto}</span>
                          )}
                          {editingQuestao !== q.id && (
                            <div className="flex items-center gap-1">
                              <Badge variant={q.ativo ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">{q.ativo ? 'Ativa' : 'Inativa'}</Badge>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleQuestaoAtivo(q)}>
                                {q.ativo ? <X className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingQuestao(q.id); setEditQuestaoTexto(q.texto); }}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeQuestao(q.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={novaQuestao} onChange={(e) => setNovaQuestao(e.target.value)} placeholder="Texto da questão" className="text-sm" onKeyDown={(e) => e.key === 'Enter' && addQuestao(area.id, dim.id)} />
                        <Button size="sm" onClick={() => addQuestao(area.id, dim.id)}><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Nova Área */}
              <div className="flex gap-2 mt-2">
                <Input value={novaArea} onChange={(e) => setNovaArea(e.target.value)} placeholder="Nome da nova área" className="text-sm" onKeyDown={(e) => e.key === 'Enter' && addArea(dim.id)} />
                <Button size="sm" onClick={() => addArea(dim.id)}><Plus className="w-4 h-4 mr-1" />Área</Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

// ─── Ambientes Tab ───
const AmbientesTab = () => {
  const [ambientes, setAmbientes] = useState<(Ambiente & { perfis?: string[]; dimensoes_ids?: string[] })[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [dimensoes, setDimensoes] = useState<Dimensao[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    semestre_id: '', nome: '', nivel: 'presencial' as 'presencial' | 'ead',
    data_inicio: '', data_fim: '', perfis: [] as string[], dimensoes_ids: [] as string[],
  });
  const [prorrogarDialog, setProrrogarDialog] = useState<string | null>(null);
  const [prorrogarData, setProrrogarData] = useState('');

  const fetch = useCallback(async () => {
    const [{ data: ambs }, { data: sems }, { data: dims }] = await Promise.all([
      supabase.from('ambientes_avaliacao').select('*').order('created_at', { ascending: false }),
      supabase.from('semestres_letivos').select('*').eq('ativo', true).order('ano', { ascending: false }),
      supabase.from('dimensoes_avaliacao').select('*').eq('ativo', true).order('ordem'),
    ]);
    setSemestres(sems || []);
    setDimensoes(dims || []);
    if (!ambs) { setAmbientes([]); return; }
    const { data: perfisData } = await supabase.from('ambiente_perfis').select('*');
    const { data: dimData } = await supabase.from('ambiente_dimensoes').select('*');
    setAmbientes(ambs.map((a) => ({
      ...a,
      perfis: (perfisData || []).filter((p) => p.ambiente_id === a.id).map((p) => p.perfil),
      dimensoes_ids: (dimData || []).filter((d) => d.ambiente_id === a.id).map((d) => d.dimensao_id),
    })));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!form.semestre_id || !form.nome || !form.data_inicio || !form.data_fim) { toast.error('Preencha todos os campos obrigatórios'); return; }
    const { data: amb, error } = await supabase.from('ambientes_avaliacao').insert({
      semestre_id: form.semestre_id, nome: form.nome, nivel: form.nivel,
      data_inicio: form.data_inicio, data_fim: form.data_fim,
    }).select().single();
    if (error || !amb) { toast.error('Erro ao criar ambiente'); return; }
    if (form.perfis.length > 0) {
      await supabase.from('ambiente_perfis').insert(form.perfis.map((p) => ({ ambiente_id: amb.id, perfil: p as any })));
    }
    if (form.dimensoes_ids.length > 0) {
      await supabase.from('ambiente_dimensoes').insert(form.dimensoes_ids.map((d) => ({ ambiente_id: amb.id, dimensao_id: d })));
    }
    toast.success('Ambiente criado');
    setDialogOpen(false);
    setForm({ semestre_id: '', nome: '', nivel: 'presencial', data_inicio: '', data_fim: '', perfis: [], dimensoes_ids: [] });
    fetch();
  };

  const prorrogar = async () => {
    if (!prorrogarDialog || !prorrogarData) return;
    await supabase.from('ambientes_avaliacao').update({ prorrogado_ate: prorrogarData }).eq('id', prorrogarDialog);
    toast.success('Prorrogação registrada');
    setProrrogarDialog(null);
    setProrrogarData('');
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('ambientes_avaliacao').delete().eq('id', id);
    toast.success('Ambiente removido');
    fetch();
  };

  const togglePerfil = (p: string) => {
    setForm((f) => ({ ...f, perfis: f.perfis.includes(p) ? f.perfis.filter((x) => x !== p) : [...f.perfis, p] }));
  };

  const toggleDim = (id: string) => {
    setForm((f) => ({ ...f, dimensoes_ids: f.dimensoes_ids.includes(id) ? f.dimensoes_ids.filter((x) => x !== id) : [...f.dimensoes_ids, id] }));
  };

  const semestreNome = (id: string) => semestres.find((s) => s.id === id)?.nome || id;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-heading font-semibold text-foreground">Ambientes de Avaliação</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Novo Ambiente</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Ambiente de Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Semestre Letivo *</Label>
                <Select value={form.semestre_id} onValueChange={(v) => setForm({ ...form, semestre_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{semestres.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Avaliação Institucional 2026.1" />
              </div>
              <div>
                <Label>Nível *</Label>
                <Select value={form.nivel} onValueChange={(v: 'presencial' | 'ead') => setForm({ ...form, nivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial (por semestre)</SelectItem>
                    <SelectItem value="ead">EAD (por período)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data Início *</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                <div><Label>Data Fim *</Label><Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
              </div>
              <div>
                <Label>Perfis que irão avaliar</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {PERFIS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.perfis.includes(p)} onCheckedChange={() => togglePerfil(p)} />
                      {PERFIL_LABELS[p]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Dimensões</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {dimensoes.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.dimensoes_ids.includes(d.id)} onCheckedChange={() => toggleDim(d.id)} />
                      {d.nome}
                    </label>
                  ))}
                </div>
                {dimensoes.length === 0 && <p className="text-xs text-muted-foreground mt-1">Crie dimensões na aba "Dimensões" primeiro.</p>}
              </div>
              <Button onClick={save} className="w-full">Criar Ambiente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Regra:</strong> Presencial → avaliação por semestre | EAD → avaliação por período
      </p>

      {ambientes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ambiente configurado.</p> : (
        <div className="space-y-3">
          {ambientes.map((amb) => (
            <Card key={amb.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{amb.nome}</h4>
                    <p className="text-xs text-muted-foreground">
                      Semestre: {semestreNome(amb.semestre_id)} · {NIVEL_LABELS[amb.nivel]} ({amb.nivel === 'presencial' ? 'por semestre' : 'por período'})
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={amb.ativo ? 'default' : 'secondary'}>{amb.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Início: {new Date(amb.data_inicio).toLocaleDateString('pt-BR')}</span>
                  <span>Fim: {new Date(amb.data_fim).toLocaleDateString('pt-BR')}</span>
                  {amb.prorrogado_ate && <span className="text-warning">Prorrogado até: {new Date(amb.prorrogado_ate).toLocaleDateString('pt-BR')}</span>}
                </div>
                {amb.perfis && amb.perfis.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {amb.perfis.map((p) => <Badge key={p} variant="outline" className="text-xs">{PERFIL_LABELS[p] || p}</Badge>)}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setProrrogarDialog(amb.id); setProrrogarData(''); }}>
                    <Calendar className="w-3 h-3 mr-1" />Prorrogar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(amb.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!prorrogarDialog} onOpenChange={(o) => !o && setProrrogarDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Prorrogar Avaliação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nova data final</Label><Input type="date" value={prorrogarData} onChange={(e) => setProrrogarData(e.target.value)} /></div>
            <Button onClick={prorrogar} className="w-full">Confirmar Prorrogação</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Importação Tab ───
const ImportacaoTab = () => {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedPerfil, setSelectedPerfil] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map'>('upload');
  const [savedMappings, setSavedMappings] = useState<{ campo_sistema: string; campo_arquivo: string }[]>([]);

  useEffect(() => {
    supabase.from('ambientes_avaliacao').select('*').eq('ativo', true).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAmbientes(data);
    });
  }, []);

  useEffect(() => {
    if (selectedAmbiente && selectedPerfil) {
      supabase.from('mapeamentos_campos').select('campo_sistema, campo_arquivo')
        .eq('ambiente_id', selectedAmbiente).eq('perfil', selectedPerfil as any)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSavedMappings(data);
            const m: Record<string, string> = {};
            data.forEach((d) => { m[d.campo_sistema] = d.campo_arquivo; });
            setMapping(m);
          } else {
            setSavedMappings([]);
          }
        });
    }
  }, [selectedAmbiente, selectedPerfil]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Read Excel headers using FileReader + simple CSV/XLSX parse
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        // Try to get first line as headers (works for CSV)
        const firstLine = text.split('\n')[0];
        const cols = firstLine.split(/[,;\t]/).map((c) => c.trim().replace(/"/g, ''));
        setColumns(cols.filter(Boolean));
        setStep('map');
      }
    };
    if (f.name.endsWith('.csv') || f.name.endsWith('.txt')) {
      reader.readAsText(f);
    } else {
      // For xlsx, just show placeholder columns
      toast.info('Para melhor mapeamento, use arquivos CSV. Colunas detectadas podem ser limitadas para XLSX.');
      setColumns(['Coluna A', 'Coluna B', 'Coluna C', 'Coluna D', 'Coluna E', 'Coluna F', 'Coluna G', 'Coluna H']);
      setStep('map');
    }
  };

  const saveMapping = async () => {
    if (!selectedAmbiente || !selectedPerfil) { toast.error('Selecione ambiente e perfil'); return; }
    // Remove existing mappings
    await supabase.from('mapeamentos_campos').delete().eq('ambiente_id', selectedAmbiente).eq('perfil', selectedPerfil as any);
    const entries = Object.entries(mapping).filter(([, v]) => v);
    if (entries.length > 0) {
      await supabase.from('mapeamentos_campos').insert(
        entries.map(([campo_sistema, campo_arquivo]) => ({
          ambiente_id: selectedAmbiente,
          perfil: selectedPerfil as any,
          campo_sistema,
          campo_arquivo,
        }))
      );
    }
    toast.success('Mapeamento salvo');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Importar Base de Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ambiente de Avaliação</Label>
              <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
                <SelectTrigger><SelectValue placeholder="Selecione o ambiente" /></SelectTrigger>
                <SelectContent>{ambientes.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={selectedPerfil} onValueChange={setSelectedPerfil}>
                <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
                <SelectContent>{PERFIS.map((p) => <SelectItem key={p} value={p}>{PERFIL_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedAmbiente && selectedPerfil && (
            <div>
              <Label>Arquivo (CSV ou XLSX)</Label>
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
            </div>
          )}
        </CardContent>
      </Card>

      {step === 'map' && columns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />Mapeamento de Campos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Associe cada campo do sistema à coluna correspondente do arquivo importado.</p>
            {(CAMPOS_SISTEMA_POR_PERFIL[selectedPerfil || ''] || CAMPOS_SISTEMA_DEFAULT).map((campo) => (
              <div key={campo} className="flex items-center gap-3">
                <span className="text-sm font-medium w-28 capitalize text-foreground">{campo}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <Select value={mapping[campo] || '__none__'} onValueChange={(v) => setMapping({ ...mapping, [campo]: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Selecione coluna" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhum —</SelectItem>
                    {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button onClick={saveMapping}><Save className="w-4 h-4 mr-1" />Salvar Mapeamento</Button>
          </CardContent>
        </Card>
      )}

      {savedMappings.length > 0 && step === 'upload' && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Mapeamento Atual</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {savedMappings.map((m) => (
                <div key={m.campo_sistema} className="flex items-center gap-2 text-sm">
                  <span className="font-medium capitalize w-28">{m.campo_sistema}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{m.campo_arquivo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Acadêmico Tab (Cursos → Períodos → Turmas → Disciplinas) ───
const AcademicoTab = () => {
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [semestreId, setSemestreId] = useState<string>('');
  const [cursos, setCursos] = useState<any[]>([]);
  const [expandedCurso, setExpandedCurso] = useState<string | null>(null);
  const [expandedPeriodo, setExpandedPeriodo] = useState<string | null>(null);
  const [expandedTurma, setExpandedTurma] = useState<string | null>(null);
  const [formCurso, setFormCurso] = useState({ nome: '', sigla: '' });
  const [formPeriodo, setFormPeriodo] = useState({ numero: 1 });
  const [formTurma, setFormTurma] = useState({ nome: '', codigo: '' });
  const [formDisc, setFormDisc] = useState({ nome: '', codigo: '', carga_horaria: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const fetchSemestres = useCallback(async () => {
    const { data } = await supabase.from('semestres_letivos').select('*').order('ano', { ascending: false });
    if (data) { setSemestres(data); if (data.length && !semestreId) setSemestreId(data[0].id); }
  }, [semestreId]);

  const fetchCursos = useCallback(async () => {
    if (!semestreId) return;
    const { data: cs } = await supabase.from('cursos').select('*').eq('semestre_id', semestreId).order('nome');
    const cursoIds = (cs || []).map(c => c.id);
    let periodos: any[] = [], turmas: any[] = [], disciplinas: any[] = [];
    if (cursoIds.length) {
      const { data: ps } = await supabase.from('periodos').select('*').in('curso_id', cursoIds).order('numero');
      periodos = ps || [];
      const periodoIds = periodos.map(p => p.id);
      if (periodoIds.length) {
        const { data: ts } = await supabase.from('turmas').select('*').in('periodo_id', periodoIds).order('nome');
        turmas = ts || [];
        const turmaIds = turmas.map(t => t.id);
        if (turmaIds.length) {
          const { data: ds } = await supabase.from('disciplinas').select('*').in('turma_id', turmaIds).order('nome');
          disciplinas = ds || [];
        }
      }
    }
    setCursos((cs || []).map(c => ({
      ...c,
      periodos: periodos.filter(p => p.curso_id === c.id).map(p => ({
        ...p,
        turmas: turmas.filter(t => t.periodo_id === p.id).map(t => ({
          ...t,
          disciplinas: disciplinas.filter(d => d.turma_id === t.id),
        })),
      })),
    })));
  }, [semestreId]);

  useEffect(() => { fetchSemestres(); }, [fetchSemestres]);
  useEffect(() => { fetchCursos(); }, [fetchCursos]);

  // CRUD helpers
  const addCurso = async () => {
    if (!formCurso.nome.trim() || !semestreId) return;
    await supabase.from('cursos').insert({ nome: formCurso.nome, sigla: formCurso.sigla, semestre_id: semestreId });
    setFormCurso({ nome: '', sigla: '' }); toast.success('Curso criado'); fetchCursos();
  };
  const removeCurso = async (id: string) => { await supabase.from('cursos').delete().eq('id', id); toast.success('Curso removido'); fetchCursos(); };
  const saveEdit = async (table: string, id: string) => {
    await (supabase.from(table as any) as any).update({ nome: editVal }).eq('id', id);
    setEditingId(null); fetchCursos();
  };

  const addPeriodo = async (cursoId: string) => {
    const nome = `${formPeriodo.numero}º Período`;
    await supabase.from('periodos').insert({ numero: formPeriodo.numero, nome, curso_id: cursoId });
    setFormPeriodo({ numero: 1 }); toast.success('Período criado'); fetchCursos();
  };
  const removePeriodo = async (id: string) => { await supabase.from('periodos').delete().eq('id', id); toast.success('Período removido'); fetchCursos(); };

  const addTurma = async (periodoId: string) => {
    if (!formTurma.nome.trim()) return;
    await supabase.from('turmas').insert({ nome: formTurma.nome, codigo: formTurma.codigo, periodo_id: periodoId });
    setFormTurma({ nome: '', codigo: '' }); toast.success('Turma criada'); fetchCursos();
  };
  const removeTurma = async (id: string) => { await supabase.from('turmas').delete().eq('id', id); toast.success('Turma removida'); fetchCursos(); };

  const addDisc = async (turmaId: string) => {
    if (!formDisc.nome.trim()) return;
    await supabase.from('disciplinas').insert({ nome: formDisc.nome, codigo: formDisc.codigo, carga_horaria: formDisc.carga_horaria, turma_id: turmaId });
    setFormDisc({ nome: '', codigo: '', carga_horaria: 0 }); toast.success('Disciplina criada'); fetchCursos();
  };
  const removeDisc = async (id: string) => { await supabase.from('disciplinas').delete().eq('id', id); toast.success('Disciplina removida'); fetchCursos(); };

  const EditableLabel = ({ id, table, label, className: cls }: { id: string; table: string; label: string; className?: string }) =>
    editingId === id ? (
      <div className="flex items-center gap-1">
        <Input value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(table, id)} className={cn("h-6 w-40", cls)} autoFocus />
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveEdit(table, id)}><Save className="w-3 h-3" /></Button>
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
      </div>
    ) : (
      <span className={cls} onDoubleClick={() => { setEditingId(id); setEditVal(label); }}>{label}</span>
    );

  const ActionBtns = ({ id, table, name, onRemove }: { id: string; table: string; name: string; onRemove: () => void }) => (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(id); setEditVal(name); }}><Edit2 className="w-3 h-3" /></Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}><Trash2 className="w-3 h-3 text-destructive" /></Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cadastro Acadêmico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Semestre</Label>
            <Select value={semestreId} onValueChange={setSemestreId}>
              <SelectTrigger><SelectValue placeholder="Selecione o semestre" /></SelectTrigger>
              <SelectContent>{semestres.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {semestreId && (
            <>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Label>Curso</Label><Input value={formCurso.nome} onChange={e => setFormCurso({ ...formCurso, nome: e.target.value })} placeholder="Ex: Engenharia de Software" /></div>
                <div className="w-28"><Label>Sigla</Label><Input value={formCurso.sigla} onChange={e => setFormCurso({ ...formCurso, sigla: e.target.value })} placeholder="ES" /></div>
                <Button onClick={addCurso}><Plus className="w-4 h-4 mr-1" />Curso</Button>
              </div>

              {cursos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum curso cadastrado.</p> : (
                <div className="space-y-2">
                  {cursos.map(c => (
                    <div key={c.id} className="border rounded-md">
                      {/* Curso */}
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpandedCurso(expandedCurso === c.id ? null : c.id)}>
                          {expandedCurso === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <EditableLabel id={c.id} table="cursos" label={c.nome} className="font-medium" />
                          {c.sigla && <Badge variant="outline">{c.sigla}</Badge>}
                          <Badge variant="secondary">{c.periodos?.length || 0} períodos</Badge>
                        </div>
                        <ActionBtns id={c.id} table="cursos" name={c.nome} onRemove={() => removeCurso(c.id)} />
                      </div>

                      {expandedCurso === c.id && (
                        <div className="p-3 pl-8 space-y-3 border-t">
                          <div className="flex gap-2 items-end">
                            <div className="w-28"><Label>Nº Período</Label><Input type="number" min={1} value={formPeriodo.numero} onChange={e => setFormPeriodo({ numero: +e.target.value })} /></div>
                            <Button size="sm" onClick={() => addPeriodo(c.id)}><Plus className="w-4 h-4 mr-1" />Período</Button>
                          </div>

                          {(c.periodos || []).map((p: any) => (
                            <div key={p.id} className="border rounded-md">
                              {/* Período */}
                              <div className="flex items-center justify-between p-2 bg-muted/20">
                                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpandedPeriodo(expandedPeriodo === p.id ? null : p.id)}>
                                  {expandedPeriodo === p.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  <span className="text-sm font-medium">{p.nome || `${p.numero}º Período`}</span>
                                  <Badge variant="secondary" className="text-xs">{p.turmas?.length || 0} turmas</Badge>
                                </div>
                                <ActionBtns id={p.id} table="periodos" name={p.nome} onRemove={() => removePeriodo(p.id)} />
                              </div>

                              {expandedPeriodo === p.id && (
                                <div className="p-2 pl-6 space-y-2 border-t">
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1"><Label className="text-xs">Turma</Label><Input value={formTurma.nome} onChange={e => setFormTurma({ ...formTurma, nome: e.target.value })} placeholder="Ex: Turma A" className="h-7 text-sm" /></div>
                                    <div className="w-24"><Label className="text-xs">Código</Label><Input value={formTurma.codigo} onChange={e => setFormTurma({ ...formTurma, codigo: e.target.value })} placeholder="TA" className="h-7 text-sm" /></div>
                                    <Button size="sm" className="h-7 text-xs" onClick={() => addTurma(p.id)}><Plus className="w-3 h-3 mr-1" />Turma</Button>
                                  </div>

                                  {(p.turmas || []).map((t: any) => (
                                    <div key={t.id} className="border rounded-md">
                                      {/* Turma */}
                                      <div className="flex items-center justify-between p-1.5 bg-muted/10">
                                        <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpandedTurma(expandedTurma === t.id ? null : t.id)}>
                                          {expandedTurma === t.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                          <EditableLabel id={t.id} table="turmas" label={t.nome} className="text-sm font-medium" />
                                          {t.codigo && <Badge variant="outline" className="text-xs">{t.codigo}</Badge>}
                                          <Badge variant="secondary" className="text-xs">{t.disciplinas?.length || 0} disc.</Badge>
                                        </div>
                                        <ActionBtns id={t.id} table="turmas" name={t.nome} onRemove={() => removeTurma(t.id)} />
                                      </div>

                                      {expandedTurma === t.id && (
                                        <div className="p-2 pl-6 space-y-2 border-t">
                                          <div className="flex gap-2 items-end">
                                            <div className="flex-1"><Label className="text-xs">Disciplina</Label><Input value={formDisc.nome} onChange={e => setFormDisc({ ...formDisc, nome: e.target.value })} placeholder="Ex: Cálculo I" className="h-7 text-sm" /></div>
                                            <div className="w-24"><Label className="text-xs">Código</Label><Input value={formDisc.codigo} onChange={e => setFormDisc({ ...formDisc, codigo: e.target.value })} placeholder="MAT01" className="h-7 text-sm" /></div>
                                            <div className="w-16"><Label className="text-xs">CH</Label><Input type="number" value={formDisc.carga_horaria} onChange={e => setFormDisc({ ...formDisc, carga_horaria: +e.target.value })} className="h-7 text-sm" /></div>
                                            <Button size="sm" className="h-7 text-xs" onClick={() => addDisc(t.id)}><Plus className="w-3 h-3 mr-1" />Disc.</Button>
                                          </div>

                                          {(t.disciplinas || []).map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                                              <div className="flex items-center gap-2">
                                                <EditableLabel id={d.id} table="disciplinas" label={d.nome} className="text-sm" />
                                                {d.codigo && <Badge variant="outline" className="text-xs">{d.codigo}</Badge>}
                                                {d.carga_horaria > 0 && <span className="text-xs text-muted-foreground">{d.carga_horaria}h</span>}
                                              </div>
                                              <ActionBtns id={d.id} table="disciplinas" name={d.nome} onRemove={() => removeDisc(d.id)} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Main Component ───
const ConfiguracaoAmbienteSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Configuração de Ambiente</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure semestres, dimensões, ambientes de avaliação, acadêmico e importações</p>
      </div>

      <Tabs defaultValue="semestres">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="semestres">Semestres</TabsTrigger>
          <TabsTrigger value="dimensoes">Dimensões</TabsTrigger>
          <TabsTrigger value="academico">Acadêmico</TabsTrigger>
          <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
          <TabsTrigger value="importacao">Importação</TabsTrigger>
        </TabsList>
        <TabsContent value="semestres"><SemestresTab /></TabsContent>
        <TabsContent value="dimensoes"><DimensoesTab /></TabsContent>
        <TabsContent value="academico"><AcademicoTab /></TabsContent>
        <TabsContent value="ambientes"><AmbientesTab /></TabsContent>
        <TabsContent value="importacao"><ImportacaoTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracaoAmbienteSection;
