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
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, ComposedChart,
} from 'recharts';
import { Upload, FileSpreadsheet, BarChart3, PieChartIcon, Search, ChevronLeft, ChevronRight, Database, BookOpen, Layers, Calendar, History, Trash2, Eye, Users, Settings2, Minus, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSortable } from '@/hooks/use-sortable';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useColumnOrder, type ColumnDef } from '@/hooks/use-column-order';
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

// Cores padronizadas por conceito (conforme referência CPA)
const CONCEITO_COLORS: Record<string, string> = {
  'E': '#34a853',       // Excelente - verde
  'EXCELENTE': '#34a853',
  'B': '#4285f4',       // Bom - azul
  'BOM': '#4285f4',
  'AP': '#fbbc04',      // Atende Parcialmente - amarelo
  'ATENDE PARCIALMENTE': '#fbbc04',
  'RE': '#ea4335',      // Regular - vermelho/laranja
  'REGULAR': '#ea4335',
  'MR': '#c5221f',      // Muito Ruim - vermelho escuro
  'MUITO RUIM': '#c5221f',
  'MUITO_RUIM': '#c5221f',
  '--': '#1a237e',      // Não se aplica - azul escuro
};

const RESPOSTA_COLORS: Record<string, string> = {
  'Excelente': '#34a853',
  'Bom': '#4285f4',
  'Regular': '#ea4335',
  'Atende Parc.': '#fbbc04',
  'Muito Ruim': '#c5221f',
};

function getConceptColor(name: string): string {
  return CONCEITO_COLORS[name] || CONCEITO_COLORS[name.toUpperCase()] || pieColors[0];
}

// Cor da média conforme legenda CPA:
// Excelente 4.7-5.0 | Bom 4.1-4.6 | Atende Parcialmente 3.1-4.0 | Regular 2.2-3.0 | Muito Ruim <2.2
function getMediaColor(media: number): string {
  if (!media || media <= 0) return CONCEITO_COLORS['--'];
  if (media >= 4.7) return CONCEITO_COLORS['EXCELENTE'];
  if (media >= 4.1) return CONCEITO_COLORS['BOM'];
  if (media >= 3.1) return CONCEITO_COLORS['ATENDE PARCIALMENTE'];
  if (media >= 2.2) return CONCEITO_COLORS['REGULAR'];
  return CONCEITO_COLORS['MUITO RUIM'];
}

// Custom label renderer for bars showing value
const renderBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (width < 20 && height < 15) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600}>
      {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value}
    </text>
  );
};

const renderHBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (width < 25) return null;
  return (
    <text x={x + width - 4} y={y + height / 2} fill="#fff" textAnchor="end" dominantBaseline="middle" fontSize={10} fontWeight={600}>
      {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value}
    </text>
  );
};

// ─── Chart font size control ───
const FONT_SIZE_KEY = 'chart-font-sizes';
const DEFAULT_FONT_SIZE = 11;

function loadChartFontSizes(): Record<string, number> {
  try {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function ChartFontControl({ chartId, sizes, onChange }: { chartId: string; sizes: Record<string, number>; onChange: (id: string, size: number) => void }) {
  const size = sizes[chartId] || DEFAULT_FONT_SIZE;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto flex-shrink-0" title="Tamanho da fonte">
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <p className="text-xs font-medium mb-2">Tamanho da fonte</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(chartId, Math.max(7, size - 1))} disabled={size <= 7}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-mono w-8 text-center">{size}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(chartId, Math.min(20, size + 1))} disabled={size >= 20}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  const [chartFontSizes, setChartFontSizes] = useState<Record<string, number>>(loadChartFontSizes);

  const updateFontSize = useCallback((chartId: string, size: number) => {
    setChartFontSizes(prev => {
      const next = { ...prev, [chartId]: size };
      localStorage.setItem(FONT_SIZE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const fs = (chartId: string) => chartFontSizes[chartId] || DEFAULT_FONT_SIZE;

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

        if (allRows.length === 0) {
          toast.error(`O arquivo "${file.name}" não possui linhas válidas para importar`);
          continue;
        }

        const { data: imp, error: impErr } = await supabase.from('importacoes').insert({
          periodo: importPeriodo,
          perfil: importPerfil,
          nome_arquivo: file.name,
          total_registros: allRows.length,
          observacoes: importObservacoes || '',
        }).select().single();

        if (impErr || !imp) {
          throw impErr ?? new Error('Erro ao registrar importação');
        }

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
          if (error) throw error;
        }

        toast.success(`${allRows.length} registros de "${file.name}" importados!`);
      }

      resetImportState();
      await Promise.all([fetchData(), fetchImportacoes()]);
    } catch (err) {
      console.error('Erro ao importar resultados:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao importar');
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
    // Média simples da coluna `media` (mesmo cálculo do Power BI por curso/semestre/nível):
    // soma(media das questões) / quantidade de questões.
    const map = new Map<string, { count: number; somaMedia: number; nMedia: number }>();
    filtered.forEach((r) => {
      if (!r.curso) return;
      const cur = map.get(r.curso) || { count: 0, somaMedia: 0, nMedia: 0 };
      cur.count += 1;
      const m = Number(r.media);
      if (!isNaN(m) && m > 0) { cur.somaMedia += m; cur.nMedia += 1; }
      map.set(r.curso, cur);
    });
    return [...map.entries()]
      .map(([name, v]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '…' : name,
        fullName: name,
        registros: v.count,
        media: v.nMedia > 0 ? Number((v.somaMedia / v.nMedia).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
  }, [filtered]);

  const pieConceito = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => { if (r.conceito) map.set(r.conceito, (map.get(r.conceito) || 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, fullName: name, value }));
  }, [filtered]);

  const handleCursoBarClick = useCallback((data: any) => {
    if (data?.fullName) { setFilterCurso(data.fullName); setPage(0); }
  }, []);

  const mediaPorDimensao = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    filtered.forEach((r) => {
      if (r.dimensao && r.media > 0) {
        const e = map.get(r.dimensao) || { sum: 0, count: 0 };
        e.sum += r.media; e.count += 1; map.set(r.dimensao, e);
      }
    });
    return [...map.entries()].map(([name, { sum, count }]) => ({ name: name.length > 20 ? name.substring(0, 20) + '…' : name, fullName: name, media: Number((sum / count).toFixed(2)) }));
  }, [filtered]);

  const desempenhoDimensao = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => { if (r.dimensao) map.set(r.dimensao, (map.get(r.dimensao) || 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '…' : name, fullName: name, registros: count }));
  }, [filtered]);

  const handleDimensaoBarClick = useCallback((data: any) => {
    if (data?.fullName) { setFilterDimensao(data.fullName); setPage(0); }
  }, []);

  const handleCursoChartDoubleClick = useCallback(() => {
    setFilterCurso('all'); setPage(0);
  }, []);

  const handleDimensaoChartDoubleClick = useCallback(() => {
    setFilterDimensao('all'); setPage(0);
  }, []);

  // === Colaboradores-specific charts ===
  const colabData = useMemo(() => data.filter(r => r.tipoAvaliacao === 'Colaboradores'), [data]);

  const colabMediaDimensao = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    colabData.forEach(r => {
      if (r.dimensao && r.media > 0) {
        const e = map.get(r.dimensao) || { sum: 0, count: 0 };
        e.sum += r.media; e.count += 1; map.set(r.dimensao, e);
      }
    });
    return [...map.entries()].map(([name, { sum, count }]) => ({
      name: name.length > 25 ? name.substring(0, 25) + '…' : name,
      media: Number((sum / count).toFixed(2)),
    })).sort((a, b) => b.media - a.media);
  }, [colabData]);

  const colabConceitos = useMemo(() => {
    const map = new Map<string, number>();
    colabData.forEach(r => { if (r.conceito) map.set(r.conceito, (map.get(r.conceito) || 0) + 1); });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [colabData]);

  const colabMediaArea = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    colabData.forEach(r => {
      if (r.area && r.media > 0) {
        const e = map.get(r.area) || { sum: 0, count: 0 };
        e.sum += r.media; e.count += 1; map.set(r.area, e);
      }
    });
    return [...map.entries()].map(([name, { sum, count }]) => ({
      name: name.length > 25 ? name.substring(0, 25) + '…' : name,
      media: Number((sum / count).toFixed(2)),
    })).sort((a, b) => b.media - a.media).slice(0, 15);
  }, [colabData]);

  const colabRespostas = useMemo(() => {
    let excelente = 0, bom = 0, regular = 0, atendeParcialmente = 0, muitoRuim = 0;
    colabData.forEach(r => {
      excelente += r.excelente; bom += r.bom; regular += r.regular;
      atendeParcialmente += r.atendeParcialmente; muitoRuim += r.muitoRuim;
    });
    return [
      { name: 'Excelente', value: excelente },
      { name: 'Bom', value: bom },
      { name: 'Regular', value: regular },
      { name: 'Atende Parc.', value: atendeParcialmente },
      { name: 'Muito Ruim', value: muitoRuim },
    ].filter(d => d.value > 0);
  }, [colabData]);

  const colabRadarDimensao = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    colabData.forEach(r => {
      if (r.dimensao && r.media > 0) {
        const e = map.get(r.dimensao) || { sum: 0, count: 0 };
        e.sum += r.media; e.count += 1; map.set(r.dimensao, e);
      }
    });
    return [...map.entries()].map(([name, { sum, count }]) => ({
      dimensao: name.length > 18 ? name.substring(0, 18) + '…' : name,
      media: Number((sum / count).toFixed(2)),
      fullMark: 5,
    }));
  }, [colabData]);

  const { sorted: sortedFiltered, sortConfig, requestSort } = useSortable(filtered);

  const resColumns: ColumnDef[] = [
    { key: 'tipoAvaliacao', label: 'Tipo' },
    { key: 'semestre', label: 'Semestre' },
    { key: 'curso', label: 'Curso' },
    { key: 'dimensao', label: 'Dimensão' },
    { key: 'area', label: 'Área' },
    { key: 'textoQuestao', label: 'Questão' },
    { key: 'excelente', label: 'Excelente', className: 'text-right' },
    { key: 'bom', label: 'Bom', className: 'text-right' },
    { key: 'regular', label: 'Regular', className: 'text-right' },
    { key: 'total', label: 'Total', className: 'text-right' },
    { key: 'media', label: 'Média', className: 'text-right' },
    { key: 'conceito', label: 'Conceito' },
  ];
  const { columns: orderedCols, dragIndex, overIndex, onDragStart, onDragOver, onDragEnd } = useColumnOrder(resColumns, 'resultados');

  const renderResCell = (key: string, r: ResultadoRow) => {
    switch (key) {
      case 'tipoAvaliacao': return <TableCell key={key}><Badge variant="outline" className="text-xs">{r.tipoAvaliacao}</Badge></TableCell>;
      case 'semestre': return <TableCell key={key} className="text-sm">{r.semestre}</TableCell>;
      case 'curso': return <TableCell key={key} className="text-sm max-w-[150px] truncate">{r.curso}</TableCell>;
      case 'dimensao': return <TableCell key={key} className="text-sm max-w-[150px] truncate">{r.dimensao}</TableCell>;
      case 'area': return <TableCell key={key} className="text-sm max-w-[120px] truncate">{r.area}</TableCell>;
      case 'textoQuestao': return <TableCell key={key} className="text-sm max-w-[200px] truncate">{r.textoQuestao}</TableCell>;
      case 'excelente': return <TableCell key={key} className="text-sm text-right">{r.excelente}</TableCell>;
      case 'bom': return <TableCell key={key} className="text-sm text-right">{r.bom}</TableCell>;
      case 'regular': return <TableCell key={key} className="text-sm text-right">{r.regular}</TableCell>;
      case 'total': return <TableCell key={key} className="text-sm text-right font-medium">{r.total}</TableCell>;
      case 'media': return <TableCell key={key} className="text-sm text-right font-medium">{r.media.toFixed(2)}</TableCell>;
      case 'conceito': return <TableCell key={key}><Badge variant="secondary" className={r.conceito === 'EXCELENTE' ? 'bg-success/10 text-success' : r.conceito === 'BOM' ? 'bg-primary/10 text-primary' : r.conceito === 'REGULAR' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}>{r.conceito}</Badge></TableCell>;
      default: return null;
    }
  };

  const totalPages = Math.ceil(sortedFiltered.length / PAGE_SIZE);
  const paged = sortedFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
        <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) resetImportState(); }}>
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
                <Button variant="outline" onClick={resetImportState}>Cancelar</Button>
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
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Registros por Curso<ChartFontControl chartId="cursoBar" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]" onDoubleClick={handleCursoChartDoubleClick} title="Duplo clique para resetar filtro">
              {chartByCurso.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartByCurso} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                    <XAxis xAxisId="reg" type="number" tick={{ fontSize: fs('cursoBar') }} />
                    <XAxis xAxisId="media" type="number" orientation="top" domain={[0, 5]} tick={{ fontSize: fs('cursoBar') - 1 }} stroke="hsl(var(--primary))" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: fs('cursoBar') - 1 }} width={150} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('cursoBar')}px` }} formatter={(value: number, name: string) => name === 'Média' ? [Number(value).toFixed(2), 'Média'] : [value, 'Registros']} />
                    <Legend wrapperStyle={{ fontSize: `${fs('cursoBar')}px` }} />
                    <Bar xAxisId="reg" dataKey="registros" name="Registros" radius={[0, 4, 4, 0]} label={renderHBarLabel} onClick={handleCursoBarClick} cursor="pointer">{chartByCurso.map((_, idx) => (<Cell key={idx} fill={chartColors[idx % chartColors.length]} />))}</Bar>
                    <Line xAxisId="media" dataKey="media" name="Média" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} label={{ position: 'right', fontSize: fs('cursoBar') - 1, fill: 'hsl(var(--primary))', formatter: (v: number) => v ? v.toFixed(2) : '' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Média por Curso<ChartFontControl chartId="mediaCurso" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {chartByCurso.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartByCurso} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                    <XAxis dataKey="name" tick={{ fontSize: fs('mediaCurso') - 1 }} angle={-35} textAnchor="end" interval={0} height={90} />
                    <YAxis tick={{ fontSize: fs('mediaCurso') }} domain={[0, 5]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('mediaCurso')}px` }}
                      formatter={(value: any) => [Number(value).toFixed(2), 'Média']}
                      labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label} />
                    <Bar dataKey="media" cursor="pointer" onClick={handleCursoBarClick} label={renderBarLabel}>
                      {chartByCurso.map((entry, idx) => (
                        <Cell key={idx} fill={getMediaColor(entry.media)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Média por Dimensão<ChartFontControl chartId="mediaDim" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]" onDoubleClick={handleDimensaoChartDoubleClick} title="Duplo clique para resetar filtro">
              {mediaPorDimensao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mediaPorDimensao} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: fs('mediaDim') - 1 }} angle={-30} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: fs('mediaDim') }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('mediaDim')}px` }} formatter={(value: number) => [value.toFixed(2), 'Média']} />
                    <Bar dataKey="media" radius={[4, 4, 0, 0]} label={renderBarLabel} onClick={handleDimensaoBarClick} cursor="pointer">{mediaPorDimensao.map((_, idx) => (<Cell key={idx} fill={chartColors[(idx + 2) % chartColors.length]} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Desempenho por Dimensão<ChartFontControl chartId="desempDim" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]" onDoubleClick={handleDimensaoChartDoubleClick} title="Duplo clique para resetar filtro">
              {desempenhoDimensao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={desempenhoDimensao} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: fs('desempDim') - 1 }} angle={-30} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: fs('desempDim') }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('desempDim')}px` }} />
                    <Bar dataKey="registros" radius={[4, 4, 0, 0]} label={renderBarLabel} onClick={handleDimensaoBarClick} cursor="pointer">{desempenhoDimensao.map((_, idx) => (<Cell key={idx} fill={pieColors[idx % pieColors.length]} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Colaboradores Section === */}
      {colabData.length > 0 && (
        <>
          <div className="pt-4">
            <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gráficos — Colaboradores
              <Badge variant="secondary" className="ml-2">{colabData.length.toLocaleString('pt-BR')} registros</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Visão específica dos resultados do perfil Colaboradores</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Radar — Média por Dimensão<ChartFontControl chartId="radarDim" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {colabRadarDimensao.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={colabRadarDimensao} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: fs('radarDim') - 2 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: fs('radarDim') - 1 }} />
                        <Radar name="Média" dataKey="media" stroke="hsl(214, 60%, 35%)" fill="hsl(214, 60%, 35%)" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" />Distribuição de Conceitos<ChartFontControl chartId="conceitoPie" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {colabConceitos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={colabConceitos} cx="50%" cy="50%" labelLine={true} outerRadius={110} innerRadius={60} dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          fontSize={fs('conceitoPie')}>
                          {colabConceitos.map((entry, idx) => (<Cell key={idx} fill={getConceptColor(entry.name)} />))}
                        </Pie>
                        <Legend formatter={(value: string) => {
                          const labels: Record<string, string> = { 'E': 'Excelente (4.7–5.0)', 'B': 'Bom (4.1–4.6)', 'AP': 'Atende Parcialmente (3.1–4.0)', 'RE': 'Regular (2.2–3.0)', 'MR': 'Muito Ruim (1.0–2.1)' };
                          return labels[value] || value;
                        }} wrapperStyle={{ fontSize: `${fs('conceitoPie')}px` }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('conceitoPie')}px` }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Média por Área<ChartFontControl chartId="mediaArea" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {colabMediaArea.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={colabMediaArea} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: fs('mediaArea') }} domain={[0, 'auto']} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: fs('mediaArea') - 1 }} width={180} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('mediaArea')}px` }} formatter={(value: number) => [value.toFixed(2), 'Média']} />
                        <Bar dataKey="media" radius={[0, 4, 4, 0]} label={renderHBarLabel}>{colabMediaArea.map((_, idx) => (<Cell key={idx} fill={chartColors[(idx + 3) % chartColors.length]} />))}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Distribuição de Respostas<ChartFontControl chartId="respostas" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {colabRespostas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={colabRespostas} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: fs('respostas') }} />
                        <YAxis tick={{ fontSize: fs('respostas') }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('respostas')}px` }} />
                        <Bar dataKey="value" name="Respostas" radius={[4, 4, 0, 0]} label={renderBarLabel}>
                          {colabRespostas.map((entry, idx) => (
                            <Cell key={idx} fill={RESPOSTA_COLORS[entry.name] || chartColors[idx % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Média por Dimensão (Colaboradores)<ChartFontControl chartId="colabMediaDim" sizes={chartFontSizes} onChange={updateFontSize} /></CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {colabMediaDimensao.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colabMediaDimensao} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: fs('colabMediaDim') - 1 }} angle={-30} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: fs('colabMediaDim') }} domain={[0, 5]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: `${fs('colabMediaDim')}px` }} formatter={(value: number) => [value.toFixed(2), 'Média']} />
                      <Bar dataKey="media" radius={[4, 4, 0, 0]} label={renderBarLabel}>{colabMediaDimensao.map((_, idx) => (<Cell key={idx} fill={chartColors[idx % chartColors.length]} />))}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center justify-between">
            <span className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" />{sortedFiltered.length.toLocaleString('pt-BR')} registros</span>
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
                  {orderedCols.map((col, idx) => (
                    <SortableTableHead key={col.key} sortKey={col.key} currentKey={sortConfig.key} direction={sortConfig.direction} onSort={requestSort}
                      className={`sticky top-0 bg-background ${col.className || ''}`}
                      draggable isDragging={dragIndex === idx} isOver={overIndex === idx}
                      onDragStartCol={() => onDragStart(idx)} onDragOverCol={() => onDragOver(idx)} onDragEndCol={onDragEnd}
                    >{col.label}</SortableTableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r, idx) => (
                  <TableRow key={`${page}-${idx}`}>
                    {orderedCols.map((col) => renderResCell(col.key, r))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) resetImportState(); }}>
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
              <Button variant="outline" onClick={resetImportState}>Cancelar</Button>
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
