import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { Upload, FileSpreadsheet, BarChart3, PieChartIcon, Search, ChevronLeft, ChevronRight, Database, BookOpen, Layers, Calendar, History, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface ResultadoRow {
  semestre: string;
  nivel: string;
  curso: string;
  dimensao: string;
  area: string;
  textoQuestao: string;
  excelente: number;
  bom: number;
  atendeParcialmente: number;
  regular: number;
  muitoRuim: number;
  naoSeAplica: number;
  total: number;
  media: number;
  conceito: string;
  tipoAvaliacao: string;
}

interface Importacao {
  id: string;
  periodo: string;
  perfil: string;
  nome_arquivo: string;
  total_registros: number;
  observacoes: string | null;
  created_at: string;
}

const chartColors = [
  'hsl(214, 60%, 35%)', 'hsl(200, 65%, 45%)', 'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 50%, 50%)', 'hsl(340, 60%, 50%)',
  'hsl(170, 50%, 40%)', 'hsl(25, 70%, 50%)', 'hsl(300, 40%, 45%)', 'hsl(60, 60%, 40%)',
];
const pieColors = ['#1e3a5f', '#2d8a9e', '#5cbdb9', '#e8b84a', '#c45c7c', '#6c5ce7', '#4a6741', '#cd7f32', '#8b6f5e', '#574b90'];

function parseNum(val: unknown): number {
  if (val == null || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function parseRow(row: Record<string, unknown>, tipoAvaliacao: string): ResultadoRow {
  return {
    semestre: String(row['SEMESTRE_LETIVO'] ?? ''),
    nivel: String(row['NIVEL'] ?? ''),
    curso: String(row['NOME_CURSO'] ?? row['NOME_SECAO'] ?? ''),
    dimensao: String(row['DIMENSAO'] ?? ''),
    area: String(row['AREA'] ?? row['EIXO'] ?? ''),
    textoQuestao: String(row['TEXTO_QUESTAO'] ?? ''),
    excelente: parseNum(row['EXCELENTE']),
    bom: parseNum(row['BOM']),
    atendeParcialmente: parseNum(row['ATENDE_PARCIALMENTE']),
    regular: parseNum(row['REGULAR']),
    muitoRuim: parseNum(row['MUITO_RUIM_PÉSSIMO'] ?? row['MUITO_RUIM_PESSIMO']),
    naoSeAplica: parseNum(row['NÃO_SE_APLICA'] ?? row['NAO_SE_APLICA']),
    total: parseNum(row['TOTAL']),
    media: parseNum(row['MEDIA']),
    conceito: String(row['CONCEITO'] ?? ''),
    tipoAvaliacao,
  };
}

const PAGE_SIZE = 200;

const ResultadosSection = () => {
  const [data, setData] = useState<ResultadoRow[]>([]);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [filterSemestre, setFilterSemestre] = useState('all');
  const [filterNivel, setFilterNivel] = useState('all');
  const [filterCurso, setFilterCurso] = useState('all');
  const [filterDimensao, setFilterDimensao] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [importPeriodo, setImportPeriodo] = useState('');
  const [importPerfil, setImportPerfil] = useState('');
  const [importObservacoes, setImportObservacoes] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let allRows: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data: rows, error } = await supabase
        .from('resultados')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) { console.error('Fetch error:', error); break; }
      if (!rows || rows.length === 0) break;
      allRows = allRows.concat(rows);
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    setData(allRows.map((r: any) => ({
      semestre: r.semestre,
      nivel: r.nivel,
      curso: r.curso,
      dimensao: r.dimensao,
      area: r.area,
      textoQuestao: r.texto_questao,
      excelente: r.excelente,
      bom: r.bom,
      atendeParcialmente: r.atende_parcialmente,
      regular: r.regular,
      muitoRuim: r.muito_ruim,
      naoSeAplica: r.nao_se_aplica,
      total: r.total,
      media: Number(r.media),
      conceito: r.conceito,
      tipoAvaliacao: r.tipo_avaliacao,
    })));
    setLoading(false);
  }, []);

  const fetchImportacoes = useCallback(async () => {
    const { data } = await supabase.from('importacoes').select('*').order('created_at', { ascending: false });
    if (data) setImportacoes(data as Importacao[]);
  }, []);

  useEffect(() => { fetchData(); fetchImportacoes(); }, [fetchData, fetchImportacoes]);

  const resetImportState = () => {
    setShowImportDialog(false);
    setPendingFiles([]);
    setImportPeriodo('');
    setImportPerfil('');
    setImportObservacoes('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(files);
    const name = files[0].name.toUpperCase();
    if (name.includes('ALUNO')) setImportPerfil('Alunos');
    else if (name.includes('PROFESSOR')) setImportPerfil('Professores');
    else if (name.includes('COORDENADOR')) setImportPerfil('Coordenadores');
    else if (name.includes('COLABORADOR')) setImportPerfil('Colaboradores');
    else setImportPerfil('Geral');
    setShowImportDialog(true);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (pendingFiles.length === 0 || !importPeriodo || !importPerfil) {
      toast.error('Preencha o período e o perfil');
      return;
    }
    setImporting(true);
    try {
      for (const file of pendingFiles) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        const allRows = json.map((row) => parseRow(row, importPerfil));

        // Create import record
        const { data: imp, error: impErr } = await supabase.from('importacoes').insert({
          periodo: importPeriodo,
          perfil: importPerfil,
          nome_arquivo: file.name,
          total_registros: allRows.length,
          observacoes: importObservacoes || '',
        }).select().single();

        if (impErr) { toast.error('Erro ao registrar importação'); continue; }

        // Insert results in batches of 500
        const BATCH = 500;
        for (let i = 0; i < allRows.length; i += BATCH) {
          const batch = allRows.slice(i, i + BATCH).map((r) => ({
            importacao_id: imp.id,
            semestre: r.semestre,
            nivel: r.nivel,
            curso: r.curso,
            dimensao: r.dimensao,
            area: r.area,
            texto_questao: r.textoQuestao,
            excelente: r.excelente,
            bom: r.bom,
            atende_parcialmente: r.atendeParcialmente,
            regular: r.regular,
            muito_ruim: r.muitoRuim,
            nao_se_aplica: r.naoSeAplica,
            total: r.total,
            media: r.media,
            conceito: r.conceito,
            tipo_avaliacao: r.tipoAvaliacao,
          }));
          const { error } = await supabase.from('resultados').insert(batch);
          if (error) { console.error(error); toast.error(`Erro ao inserir lote ${i}`); }
        }
        toast.success(`${allRows.length} registros de "${file.name}" importados!`);
      }
      setShowImportDialog(false);
      setPendingFiles(null);
      setImportPeriodo('');
      setImportPerfil('');
      setImportObservacoes('');
      fetchData();
      fetchImportacoes();
    } catch (err) {
      toast.error('Erro ao importar');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteImport = async (imp: Importacao) => {
    if (!confirm(`Excluir importação "${imp.nome_arquivo}" e todos os ${imp.total_registros} registros?`)) return;
    // Delete resultados first, then importacao
    const { error: resErr } = await supabase.from('resultados').delete().eq('importacao_id', imp.id);
    if (resErr) { console.error('Erro ao excluir resultados:', resErr); toast.error('Erro ao excluir resultados'); return; }
    const { error } = await supabase.from('importacoes').delete().eq('id', imp.id);
    if (error) { toast.error('Erro ao excluir importação'); return; }
    toast.success('Importação excluída');
    fetchData();
    fetchImportacoes();
  };

  // Filter options
  const filterOptions = useMemo(() => {
    const semestres = [...new Set(data.map((r) => r.semestre).filter(Boolean))].sort();
    const niveis = [...new Set(data.map((r) => r.nivel).filter(Boolean))].sort();
    const cursos = [...new Set(data.map((r) => r.curso).filter(Boolean))].sort();
    const dimensoes = [...new Set(data.map((r) => r.dimensao).filter(Boolean))].sort();
    const areas = [...new Set(data.map((r) => r.area).filter(Boolean))].sort();
    return { semestres, niveis, cursos, dimensoes, areas };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filterSemestre !== 'all' && r.semestre !== filterSemestre) return false;
      if (filterNivel !== 'all' && r.nivel !== filterNivel) return false;
      if (filterCurso !== 'all' && r.curso !== filterCurso) return false;
      if (filterDimensao !== 'all' && r.dimensao !== filterDimensao) return false;
      if (filterArea !== 'all' && r.area !== filterArea) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!r.textoQuestao.toLowerCase().includes(term) && !r.curso.toLowerCase().includes(term) && !r.dimensao.toLowerCase().includes(term) && !r.area.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [data, filterSemestre, filterNivel, filterCurso, filterDimensao, filterArea, searchTerm]);

  const stats = useMemo(() => ({
    total: filtered.length,
    cursos: new Set(filtered.map((r) => r.curso).filter(Boolean)).size,
    dimensoes: new Set(filtered.map((r) => r.dimensao).filter(Boolean)).size,
    semestres: new Set(filtered.map((r) => r.semestre).filter(Boolean)).size,
  }), [filtered]);

  const chartByCurso = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => { if (r.curso) map.set(r.curso, (map.get(r.curso) || 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '…' : name, registros: count,
    }));
  }, [filtered]);

  const pieDimensao = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => { if (r.dimensao) map.set(r.dimensao, (map.get(r.dimensao) || 0) + 1); });
    return [...map.entries()].map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '…' : name, value }));
  }, [filtered]);

  const mediaPorDimensao = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    filtered.forEach((r) => {
      if (r.dimensao && r.media > 0) {
        const e = map.get(r.dimensao) || { sum: 0, count: 0 };
        e.sum += r.media; e.count += 1; map.set(r.dimensao, e);
      }
    });
    return [...map.entries()].map(([name, { sum, count }]) => ({ name: name.length > 20 ? name.substring(0, 20) + '…' : name, media: Number((sum / count).toFixed(2)) }));
  }, [filtered]);

  const desempenhoDimensao = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => { if (r.dimensao) map.set(r.dimensao, (map.get(r.dimensao) || 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '…' : name, registros: count }));
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setFilterSemestre('all'); setFilterNivel('all'); setFilterCurso('all');
    setFilterDimensao('all'); setFilterArea('all'); setSearchTerm(''); setPage(0);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando resultados...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Resultados</h2>
            <p className="text-sm text-muted-foreground mt-1">Importe os dados das avaliações para visualizar os resultados</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => { setShowHistoryDialog(true); fetchImportacoes(); }}>
            <History className="w-4 h-4" /> Histórico
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-heading font-semibold text-foreground">Importar Dados</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Selecione um ou mais arquivos Excel (.xlsx) com os resultados das avaliações.
              </p>
            </div>
            <label className="cursor-pointer">
              <Button className="gap-2" disabled={importing} asChild>
                <span><Upload className="w-4 h-4" />{importing ? 'Importando...' : 'Selecionar Arquivos'}</span>
              </Button>
              <input type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={handleFileSelect} />
            </label>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Configurar Importação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Período / Semestre *</Label><Input placeholder="Ex: 2025.1" value={importPeriodo} onChange={(e) => setImportPeriodo(e.target.value)} /></div>
              <div><Label>Perfil *</Label>
                <SearchableSelect value={importPerfil} onValueChange={setImportPerfil} options={[
                  { value: 'Alunos', label: 'Alunos' }, { value: 'Professores', label: 'Professores' },
                  { value: 'Coordenadores', label: 'Coordenadores' }, { value: 'Colaboradores', label: 'Colaboradores' }, { value: 'Geral', label: 'Geral' },
                ]} placeholder="Perfil" className="w-full" />
              </div>
              <div><Label>Observações</Label><Input value={importObservacoes} onChange={(e) => setImportObservacoes(e.target.value)} placeholder="Opcional" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowImportDialog(false); setPendingFiles(null); }}>Cancelar</Button>
                <Button onClick={handleImportConfirm} disabled={importing}>{importing ? 'Importando...' : 'Confirmar Importação'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Histórico de Importações</DialogTitle></DialogHeader>
            {importacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação realizada.</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {importacoes.map((imp) => (
                  <Card key={imp.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{imp.nome_arquivo}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline">{imp.periodo}</Badge>
                          <Badge variant="secondary">{imp.perfil}</Badge>
                          <span>{imp.total_registros.toLocaleString('pt-BR')} registros</span>
                          <span>{new Date(imp.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {imp.observacoes && <p className="text-xs text-muted-foreground mt-1">{imp.observacoes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteImport(imp)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Resultados</h2>
          <p className="text-sm text-muted-foreground mt-1">Análise dos resultados das avaliações institucionais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => { setShowHistoryDialog(true); fetchImportacoes(); }}>
            <History className="w-4 h-4" /> Histórico
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" className="gap-2" disabled={importing} asChild>
              <span><Upload className="w-4 h-4" />Importar Mais</span>
            </Button>
            <input type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Database className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-heading font-bold text-foreground">{stats.total.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Total de registros</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-heading font-bold text-foreground">{stats.cursos}</p><p className="text-xs text-muted-foreground">Cursos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Layers className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-heading font-bold text-foreground">{stats.dimensoes}</p><p className="text-xs text-muted-foreground">Dimensões</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-heading font-bold text-foreground">{stats.semestres}</p><p className="text-xs text-muted-foreground">Semestres</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <SearchableSelect value={filterSemestre} onValueChange={(v) => { setFilterSemestre(v); setPage(0); }} options={[{ value: 'all', label: 'Todos os semestres' }, ...filterOptions.semestres.map((s) => ({ value: s, label: s }))]} placeholder="Semestre" className="w-[180px]" />
        <SearchableSelect value={filterNivel} onValueChange={(v) => { setFilterNivel(v); setPage(0); }} options={[{ value: 'all', label: 'Todos os níveis' }, ...filterOptions.niveis.map((s) => ({ value: s, label: s }))]} placeholder="Nível" className="w-[180px]" />
        <SearchableSelect value={filterCurso} onValueChange={(v) => { setFilterCurso(v); setPage(0); }} options={[{ value: 'all', label: 'Todos os cursos' }, ...filterOptions.cursos.map((s) => ({ value: s, label: s }))]} placeholder="Curso" className="w-[200px]" />
        <SearchableSelect value={filterDimensao} onValueChange={(v) => { setFilterDimensao(v); setPage(0); }} options={[{ value: 'all', label: 'Todas as dimensões' }, ...filterOptions.dimensoes.map((s) => ({ value: s, label: s }))]} placeholder="Dimensão" className="w-[200px]" />
        <SearchableSelect value={filterArea} onValueChange={(v) => { setFilterArea(v); setPage(0); }} options={[{ value: 'all', label: 'Todas as áreas' }, ...filterOptions.areas.map((s) => ({ value: s, label: s }))]} placeholder="Área" className="w-[200px]" />
        <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Registros por Curso</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {chartByCurso.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartByCurso} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="registros" radius={[0, 4, 4, 0]}>{chartByCurso.map((_, idx) => (<Cell key={idx} fill={chartColors[idx % chartColors.length]} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" />Distribuição por Dimensão</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {pieDimensao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDimensao} cx="50%" cy="50%" labelLine={false} outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieDimensao.map((_, idx) => (<Cell key={idx} fill={pieColors[idx % pieColors.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Média por Dimensão</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {mediaPorDimensao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mediaPorDimensao} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [value.toFixed(2), 'Média']} />
                    <Bar dataKey="media" radius={[4, 4, 0, 0]}>{mediaPorDimensao.map((_, idx) => (<Cell key={idx} fill={chartColors[(idx + 2) % chartColors.length]} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Desempenho por Dimensão</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {desempenhoDimensao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={desempenhoDimensao} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="registros" radius={[4, 4, 0, 0]}>{desempenhoDimensao.map((_, idx) => (<Cell key={idx} fill={pieColors[idx % pieColors.length]} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center justify-between">
            <span className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" />{filtered.length.toLocaleString('pt-BR')} registros</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
                <span>{page + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-background">Tipo</TableHead>
                  <TableHead className="sticky top-0 bg-background">Semestre</TableHead>
                  <TableHead className="sticky top-0 bg-background">Curso</TableHead>
                  <TableHead className="sticky top-0 bg-background">Dimensão</TableHead>
                  <TableHead className="sticky top-0 bg-background">Área</TableHead>
                  <TableHead className="sticky top-0 bg-background">Questão</TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">Excelente</TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">Bom</TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">Regular</TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">Total</TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">Média</TableHead>
                  <TableHead className="sticky top-0 bg-background">Conceito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r, idx) => (
                  <TableRow key={`${page}-${idx}`}>
                    <TableCell><Badge variant="outline" className="text-xs">{r.tipoAvaliacao}</Badge></TableCell>
                    <TableCell className="text-sm">{r.semestre}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{r.curso}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{r.dimensao}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{r.area}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{r.textoQuestao}</TableCell>
                    <TableCell className="text-sm text-right">{r.excelente}</TableCell>
                    <TableCell className="text-sm text-right">{r.bom}</TableCell>
                    <TableCell className="text-sm text-right">{r.regular}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{r.total}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{r.media.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={
                        r.conceito === 'EXCELENTE' ? 'bg-success/10 text-success' :
                        r.conceito === 'BOM' ? 'bg-primary/10 text-primary' :
                        r.conceito === 'REGULAR' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }>{r.conceito}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar Importação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Período / Semestre *</Label><Input placeholder="Ex: 2025.1" value={importPeriodo} onChange={(e) => setImportPeriodo(e.target.value)} /></div>
            <div><Label>Perfil *</Label>
              <SearchableSelect value={importPerfil} onValueChange={setImportPerfil} options={[
                { value: 'Alunos', label: 'Alunos' }, { value: 'Professores', label: 'Professores' },
                { value: 'Coordenadores', label: 'Coordenadores' }, { value: 'Colaboradores', label: 'Colaboradores' }, { value: 'Geral', label: 'Geral' },
              ]} placeholder="Perfil" className="w-full" />
            </div>
            <div><Label>Observações</Label><Input value={importObservacoes} onChange={(e) => setImportObservacoes(e.target.value)} placeholder="Opcional" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowImportDialog(false); setPendingFiles(null); }}>Cancelar</Button>
              <Button onClick={handleImportConfirm} disabled={importing}>{importing ? 'Importando...' : 'Confirmar Importação'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de Importações</DialogTitle></DialogHeader>
          {importacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação realizada.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {importacoes.map((imp) => (
                <Card key={imp.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{imp.nome_arquivo}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline">{imp.periodo}</Badge>
                        <Badge variant="secondary">{imp.perfil}</Badge>
                        <span>{imp.total_registros.toLocaleString('pt-BR')} registros</span>
                        <span>{new Date(imp.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {imp.observacoes && <p className="text-xs text-muted-foreground mt-1">{imp.observacoes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteImport(imp)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultadosSection;
