import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  FileText, Plus, Eye, Pencil, Trash2, Search, BarChart3, PieChart as PieChartIcon,
  TrendingUp, Layers, Play, Save, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Table/field metadata ───
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

interface TableDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

const TABLES: TableDef[] = [
  {
    key: 'resultados', label: 'Resultados',
    fields: [
      { key: 'tipo_avaliacao', label: 'Tipo Avaliação', type: 'text' },
      { key: 'semestre', label: 'Semestre', type: 'text' },
      { key: 'nivel', label: 'Nível', type: 'text' },
      { key: 'curso', label: 'Curso', type: 'text' },
      { key: 'dimensao', label: 'Dimensão', type: 'text' },
      { key: 'area', label: 'Área', type: 'text' },
      { key: 'texto_questao', label: 'Questão', type: 'text' },
      { key: 'excelente', label: 'Excelente', type: 'number' },
      { key: 'bom', label: 'Bom', type: 'number' },
      { key: 'atende_parcialmente', label: 'Atende Parcialmente', type: 'number' },
      { key: 'regular', label: 'Regular', type: 'number' },
      { key: 'muito_ruim', label: 'Muito Ruim', type: 'number' },
      { key: 'nao_se_aplica', label: 'Não se Aplica', type: 'number' },
      { key: 'total', label: 'Total', type: 'number' },
      { key: 'media', label: 'Média', type: 'number' },
      { key: 'conceito', label: 'Conceito', type: 'text' },
    ],
  },
  {
    key: 'acoes', label: 'Ações',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text' },
      { key: 'eixo', label: 'Eixo', type: 'text' },
      { key: 'meta', label: 'Meta', type: 'text' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'percentual_progresso', label: '% Progresso', type: 'number' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
    ],
  },
  {
    key: 'reunioes', label: 'Reuniões',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'data_hora', label: 'Data/Hora', type: 'date' },
      { key: 'tipo', label: 'Tipo', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'local', label: 'Local', type: 'text' },
    ],
  },
  {
    key: 'setores', label: 'Setores',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text' },
      { key: 'sigla', label: 'Sigla', type: 'text' },
      { key: 'tipo', label: 'Tipo', type: 'text' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
  },
  {
    key: 'usuarios_cpa', label: 'Coordenadores/Gestores',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'text' },
      { key: 'cargo', label: 'Cargo', type: 'text' },
      { key: 'departamento', label: 'Departamento', type: 'text' },
      { key: 'tipo_usuario', label: 'Tipo Usuário', type: 'text' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
  },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'pie', label: 'Pizza', icon: PieChartIcon },
  { value: 'line', label: 'Linha', icon: TrendingUp },
  { value: 'area', label: 'Área', icon: Layers },
  { value: 'table', label: 'Tabela', icon: FileText },
];

const chartColors = [
  'hsl(214, 60%, 35%)', 'hsl(200, 65%, 45%)', 'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 50%, 50%)', 'hsl(340, 60%, 50%)',
  'hsl(170, 50%, 40%)', 'hsl(25, 70%, 50%)', 'hsl(300, 40%, 45%)', 'hsl(60, 60%, 40%)',
];

interface Relatorio {
  id: string;
  titulo: string;
  descricao: string;
  tabela_origem: string;
  campos_selecionados: string[];
  tipo_grafico: string;
  filtros: Record<string, string>;
  configuracao: { campoAgrupamento?: string; campoValor?: string; agregacao?: string };
  created_at: string;
}

const AGREGACOES = [
  { value: 'count', label: 'Contagem' },
  { value: 'sum', label: 'Soma' },
  { value: 'avg', label: 'Média' },
];

const RelatoriosSection = () => {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRelatorio, setPreviewRelatorio] = useState<Relatorio | null>(null);

  // Form
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTabela, setFormTabela] = useState('');
  const [formCampos, setFormCampos] = useState<string[]>([]);
  const [formTipoGrafico, setFormTipoGrafico] = useState('bar');
  const [formAgrupamento, setFormAgrupamento] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formAgregacao, setFormAgregacao] = useState('count');

  const fetchRelatorios = useCallback(async () => {
    const { data, error } = await supabase.from('relatorios').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Erro ao carregar relatórios'); return; }
    setRelatorios((data || []).map((r: any) => ({
      ...r,
      campos_selecionados: r.campos_selecionados || [],
      filtros: r.filtros || {},
      configuracao: r.configuracao || {},
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchRelatorios(); }, [fetchRelatorios]);

  const tabelaAtual = useMemo(() => TABLES.find((t) => t.key === formTabela), [formTabela]);
  const camposTexto = useMemo(() => tabelaAtual?.fields.filter((f) => f.type === 'text') || [], [tabelaAtual]);
  const camposNumero = useMemo(() => tabelaAtual?.fields.filter((f) => f.type === 'number') || [], [tabelaAtual]);

  const resetForm = () => {
    setFormTitulo(''); setFormDescricao(''); setFormTabela(''); setFormCampos([]);
    setFormTipoGrafico('bar'); setFormAgrupamento(''); setFormValor(''); setFormAgregacao('count');
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDialogMode('create'); setDialogOpen(true); };
  const openEdit = (r: Relatorio) => {
    setFormTitulo(r.titulo);
    setFormDescricao(r.descricao);
    setFormTabela(r.tabela_origem);
    setFormCampos(r.campos_selecionados);
    setFormTipoGrafico(r.tipo_grafico);
    setFormAgrupamento(r.configuracao.campoAgrupamento || '');
    setFormValor(r.configuracao.campoValor || '');
    setFormAgregacao(r.configuracao.agregacao || 'count');
    setEditingId(r.id);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const toggleCampo = (key: string) => {
    setFormCampos((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    if (!formTitulo || !formTabela || formCampos.length === 0) {
      toast.error('Preencha título, tabela e selecione ao menos um campo');
      return;
    }
    setSaving(true);
    const payload = {
      titulo: formTitulo,
      descricao: formDescricao,
      tabela_origem: formTabela,
      campos_selecionados: formCampos,
      tipo_grafico: formTipoGrafico,
      filtros: {},
      configuracao: { campoAgrupamento: formAgrupamento, campoValor: formValor, agregacao: formAgregacao },
    };

    if (dialogMode === 'create') {
      const { error } = await supabase.from('relatorios').insert(payload);
      if (error) { toast.error('Erro ao criar relatório'); setSaving(false); return; }
      toast.success('Relatório criado!');
    } else if (editingId) {
      const { error } = await supabase.from('relatorios').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return; }
      toast.success('Relatório atualizado!');
    }
    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchRelatorios();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('relatorios').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Relatório excluído');
    setDeleteId(null);
    fetchRelatorios();
  };

  const executeRelatorio = async (r: Relatorio) => {
    setPreviewLoading(true);
    setPreviewRelatorio(r);
    setPreviewOpen(true);

    const selectFields = r.campos_selecionados.join(',');
    let query = supabase.from(r.tabela_origem as any).select(selectFields);

    const { data, error } = await query.limit(5000);
    if (error) { toast.error('Erro ao consultar dados'); setPreviewLoading(false); return; }
    setPreviewData((data as Record<string, unknown>[]) || []);
    setPreviewLoading(false);
  };

  // Chart data aggregation
  const chartData = useMemo(() => {
    if (!previewRelatorio || !previewData.length) return [];
    const { campoAgrupamento, campoValor, agregacao } = previewRelatorio.configuracao;
    if (!campoAgrupamento) return [];

    const groups = new Map<string, { sum: number; count: number }>();
    previewData.forEach((row) => {
      const groupKey = String((row as any)[campoAgrupamento] || 'N/A');
      const val = campoValor ? Number((row as any)[campoValor]) || 0 : 1;
      const entry = groups.get(groupKey) || { sum: 0, count: 0 };
      entry.sum += val;
      entry.count += 1;
      groups.set(groupKey, entry);
    });

    return [...groups.entries()]
      .map(([name, { sum, count }]) => ({
        name: name.length > 25 ? name.substring(0, 22) + '…' : name,
        value: agregacao === 'avg' ? Number((sum / count).toFixed(2)) : agregacao === 'sum' ? sum : count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  }, [previewData, previewRelatorio]);

  const filtered = relatorios.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.titulo.toLowerCase().includes(term) || r.descricao.toLowerCase().includes(term);
  });

  const getTableLabel = (key: string) => TABLES.find((t) => t.key === key)?.label || key;
  const getChartLabel = (key: string) => CHART_TYPES.find((t) => t.value === key)?.label || key;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">Monte relatórios personalizados com dados do sistema</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Novo Relatório</Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar relatórios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Nenhum relatório</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Crie relatórios personalizados escolhendo tabelas, campos e tipos de gráficos.
            </p>
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Criar Primeiro Relatório</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const ChartIcon = CHART_TYPES.find((c) => c.value === r.tipo_grafico)?.icon || BarChart3;
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ChartIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-heading leading-tight">{r.titulo}</CardTitle>
                        {r.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.descricao}</p>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="outline" className="text-[11px]">{getTableLabel(r.tabela_origem)}</Badge>
                    <Badge variant="secondary" className="text-[11px]">{getChartLabel(r.tipo_grafico)}</Badge>
                    <Badge variant="secondary" className="text-[11px]">{r.campos_selecionados.length} campos</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Criado em {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="default" size="sm" className="flex-1 gap-1 text-xs" onClick={() => executeRelatorio(r)}>
                      <Play className="w-3 h-3" />Executar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialogMode === 'create' ? 'Novo Relatório' : 'Editar Relatório'}</DialogTitle>
            <DialogDescription>Configure os dados e visualização do relatório</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Título e Descrição */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} placeholder="Ex: Desempenho por Dimensão" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descreva o objetivo do relatório..." rows={2} />
              </div>
            </div>

            {/* Tabela de Origem */}
            <div className="space-y-2">
              <Label>Tabela de Origem *</Label>
              <SearchableSelect
                value={formTabela}
                onValueChange={(v) => { setFormTabela(v); setFormCampos([]); setFormAgrupamento(''); setFormValor(''); }}
                options={TABLES.map((t) => ({ value: t.key, label: t.label }))}
                placeholder="Selecione a tabela"
                className="w-full"
              />
            </div>

            {/* Campos */}
            {tabelaAtual && (
              <div className="space-y-2">
                <Label>Campos a exibir *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/30 max-h-[200px] overflow-y-auto">
                  {tabelaAtual.fields.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox checked={formCampos.includes(f.key)} onCheckedChange={() => toggleCampo(f.key)} />
                      <span className="truncate">{f.label}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0">
                        {f.type === 'number' ? 'Nº' : f.type === 'date' ? 'Data' : 'Txt'}
                      </Badge>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFormCampos(tabelaAtual.fields.map((f) => f.key))}>Selecionar todos</Button>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFormCampos([])}>Limpar seleção</Button>
                </div>
              </div>
            )}

            {/* Tipo de Gráfico */}
            <div className="space-y-2">
              <Label>Tipo de Visualização *</Label>
              <div className="grid grid-cols-5 gap-2">
                {CHART_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const selected = formTipoGrafico === ct.value;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => setFormTipoGrafico(ct.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-[11px] font-medium ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{ct.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agrupamento e Valor (for chart types) */}
            {formTipoGrafico !== 'table' && tabelaAtual && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Agrupar por</Label>
                  <SearchableSelect
                    value={formAgrupamento}
                    onValueChange={setFormAgrupamento}
                    options={[{ value: '', label: 'Nenhum' }, ...camposTexto.map((f) => ({ value: f.key, label: f.label }))]}
                    placeholder="Campo"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <SearchableSelect
                    value={formValor}
                    onValueChange={setFormValor}
                    options={[{ value: '', label: 'Nenhum' }, ...camposNumero.map((f) => ({ value: f.key, label: f.label }))]}
                    placeholder="Campo numérico"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agregação</Label>
                  <SearchableSelect
                    value={formAgregacao}
                    onValueChange={setFormAgregacao}
                    options={AGREGACOES}
                    placeholder="Tipo"
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {dialogMode === 'create' ? 'Salvar Relatório' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Preview / Execute Dialog ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {previewRelatorio?.titulo}
            </DialogTitle>
            {previewRelatorio?.descricao && (
              <DialogDescription>{previewRelatorio.descricao}</DialogDescription>
            )}
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="flex gap-4">
                <Badge variant="outline">{previewData.length.toLocaleString('pt-BR')} registros</Badge>
                <Badge variant="secondary">{previewRelatorio?.campos_selecionados.length} campos</Badge>
                <Badge variant="secondary">{getTableLabel(previewRelatorio?.tabela_origem || '')}</Badge>
              </div>

              {/* Chart */}
              {previewRelatorio?.tipo_grafico !== 'table' && chartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-heading">
                      {previewRelatorio?.configuracao.campoAgrupamento
                        ? `${AGREGACOES.find((a) => a.value === previewRelatorio?.configuracao.agregacao)?.label || 'Contagem'} por ${
                          TABLES.find((t) => t.key === previewRelatorio?.tabela_origem)?.fields.find((f) => f.key === previewRelatorio?.configuracao.campoAgrupamento)?.label || previewRelatorio?.configuracao.campoAgrupamento
                        }`
                        : 'Gráfico'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {previewRelatorio?.tipo_grafico === 'bar' ? (
                          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={180} />
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {chartData.map((_, idx) => (<Cell key={idx} fill={chartColors[idx % chartColors.length]} />))}
                            </Bar>
                          </BarChart>
                        ) : previewRelatorio?.tipo_grafico === 'pie' ? (
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" outerRadius={140} dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                              {chartData.map((_, idx) => (<Cell key={idx} fill={chartColors[idx % chartColors.length]} />))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                          </PieChart>
                        ) : previewRelatorio?.tipo_grafico === 'line' ? (
                          <LineChart data={chartData} margin={{ left: 10, right: 20 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            <Line type="monotone" dataKey="value" stroke="hsl(214, 60%, 35%)" strokeWidth={2} dot={{ fill: 'hsl(214, 60%, 35%)' }} />
                          </LineChart>
                        ) : (
                          <AreaChart data={chartData} margin={{ left: 10, right: 20 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="value" stroke="hsl(214, 60%, 35%)" fill="hsl(214, 60%, 35%)" fillOpacity={0.2} />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-heading">Dados ({Math.min(previewData.length, 500)} de {previewData.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewRelatorio?.campos_selecionados.map((c) => {
                            const fieldDef = TABLES.find((t) => t.key === previewRelatorio.tabela_origem)?.fields.find((f) => f.key === c);
                            return <TableHead key={c} className="sticky top-0 bg-background text-xs">{fieldDef?.label || c}</TableHead>;
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 500).map((row, idx) => (
                          <TableRow key={idx}>
                            {previewRelatorio?.campos_selecionados.map((c) => (
                              <TableCell key={c} className="text-xs max-w-[200px] truncate">
                                {String((row as any)[c] ?? '—')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Relatório</AlertDialogTitle>
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

export default RelatoriosSection;
