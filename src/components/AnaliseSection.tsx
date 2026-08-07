import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  LabelList, ResponsiveContainer,
} from 'recharts';
import {
  BarChart3, BarChartHorizontal, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon,
  Table as TableIcon, ScatterChart as ScatterIcon, Plus, X, Filter, Rows3, Columns3,
  Presentation, BookOpen, FileSpreadsheet, Trash2, Loader2, Palette, Ruler, Tag, Layers,
  ChevronDown, ChevronRight, Copy,
} from 'lucide-react';


/* ---------------- Modelo de dados ---------------- */

type Kind = 'dim' | 'measure';
interface FieldDef { key: string; label: string; kind: Kind }

const FIELDS: FieldDef[] = [
  { key: 'semestre', label: 'Semestre Letivo', kind: 'dim' },
  { key: 'nivel', label: 'Nível', kind: 'dim' },
  { key: 'curso', label: 'Descrição Curso', kind: 'dim' },
  { key: 'dimensao', label: 'Dimensão', kind: 'dim' },
  { key: 'area', label: 'Área', kind: 'dim' },
  { key: 'textoQuestao', label: 'Questão', kind: 'dim' },
  { key: 'conceito', label: 'Conceito', kind: 'dim' },
  { key: 'tipoAvaliacao', label: 'Tipo de Avaliação', kind: 'dim' },
  { key: 'media', label: 'Média', kind: 'measure' },
  { key: 'total', label: 'Total', kind: 'measure' },
  { key: 'excelente', label: 'Excelente', kind: 'measure' },
  { key: 'bom', label: 'Bom', kind: 'measure' },
  { key: 'atendeParcialmente', label: 'Atende Parcialmente', kind: 'measure' },
  { key: 'regular', label: 'Regular', kind: 'measure' },
  { key: 'muitoRuim', label: 'Muito Ruim', kind: 'measure' },
  { key: 'naoSeAplica', label: 'Não se Aplica', kind: 'measure' },
];

const fieldOf = (key: string) => FIELDS.find((f) => f.key === key)!;

type ChartType = 'bar' | 'barh' | 'line' | 'area' | 'pie' | 'scatter' | 'table';
const CHART_TYPES: { type: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { type: 'bar', label: 'Colunas', icon: BarChart3 },
  { type: 'barh', label: 'Barras', icon: BarChartHorizontal },
  { type: 'line', label: 'Linhas', icon: LineIcon },
  { type: 'area', label: 'Área', icon: AreaIcon },
  { type: 'pie', label: 'Pizza', icon: PieIcon },
  { type: 'scatter', label: 'Dispersão', icon: ScatterIcon },
  { type: 'table', label: 'Tabela', icon: TableIcon },
];

type Agg = 'avg' | 'sum' | 'count';
interface Pill { key: string; agg?: Agg }
interface FilterDef { key: string; values: string[] }
type MarkSlot = 'color' | 'size' | 'label' | 'detail';

interface Sheet {
  id: string; name: string;
  cols: Pill[]; rows: Pill[]; filters: FilterDef[];
  color?: Pill; size?: Pill; label?: Pill; detail?: Pill;
  chart: ChartType;
  palette?: string;
  seriesColors?: Record<string, string>;
  legend?: Record<string, string>;
}
interface Dashboard { id: string; name: string; sheetIds: string[] }
interface StoryPoint { id: string; sheetId: string; caption: string }
interface Story { id: string; name: string; points: StoryPoint[] }

interface Row { [k: string]: string | number }

const uid = () => Math.random().toString(36).slice(2, 9);
const newSheet = (n: number): Sheet => ({
  id: uid(), name: `Planilha ${n}`, cols: [], rows: [], filters: [], chart: 'bar', palette: 'default',
});

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const PALETTES: { id: string; label: string; colors: string[] }[] = [
  { id: 'default', label: 'Padrão', colors: COLORS },
  { id: 'cpa', label: 'Conceitos CPA', colors: ['hsl(142 70% 42%)', 'hsl(199 85% 45%)', 'hsl(45 93% 47%)', 'hsl(25 92% 53%)', 'hsl(0 78% 55%)'] },
  { id: 'azuis', label: 'Azuis', colors: ['hsl(210 90% 25%)', 'hsl(210 85% 38%)', 'hsl(205 80% 50%)', 'hsl(198 75% 62%)', 'hsl(192 70% 75%)'] },
  { id: 'quentes', label: 'Quentes', colors: ['hsl(350 75% 45%)', 'hsl(12 85% 52%)', 'hsl(28 90% 55%)', 'hsl(40 92% 58%)', 'hsl(52 90% 60%)'] },
  { id: 'verdes', label: 'Verdes', colors: ['hsl(160 70% 25%)', 'hsl(155 60% 35%)', 'hsl(148 55% 45%)', 'hsl(140 50% 57%)', 'hsl(130 48% 70%)'] },
  { id: 'sobrio', label: 'Sóbrio', colors: ['hsl(222 25% 25%)', 'hsl(222 15% 40%)', 'hsl(220 12% 55%)', 'hsl(220 10% 68%)', 'hsl(220 8% 80%)'] },
];
const paletteOf = (id?: string) => PALETTES.find((p) => p.id === id)?.colors || COLORS;
const STORAGE_KEY = 'cpa-analise-workbook';

const aggValue = (vals: number[], agg: Agg) => {
  const sum = vals.reduce((a, v) => a + v, 0);
  if (agg === 'count') return vals.length;
  if (agg === 'avg') return Number((sum / (vals.length || 1)).toFixed(2));
  return Number(sum.toFixed(2));
};

/* ---------------- Agregação ---------------- */

interface Marks { color?: Pill; size?: Pill; label?: Pill; detail?: Pill }

function aggregate(data: Row[], cols: Pill[], rows: Pill[], marks: Marks = {}) {
  const isDim = (p?: Pill) => !!p && fieldOf(p.key).kind === 'dim';
  const colDims = cols.filter((p) => fieldOf(p.key).kind === 'dim');
  const rowDims = rows.filter((p) => fieldOf(p.key).kind === 'dim');
  const measures = [...cols, ...rows].filter((p) => fieldOf(p.key).kind === 'measure');

  // Detalhe: aumenta a granularidade do eixo. Cor (dimensão): quebra em séries.
  const xDims = [...colDims, ...(isDim(marks.detail) ? [marks.detail!] : [])];
  const grpDims = [...rowDims, ...(isDim(marks.color) ? [marks.color!] : [])];

  const label = (p: Pill) => `${(p.agg || 'avg') === 'avg' ? 'MÉD' : (p.agg === 'sum' ? 'SOMA' : 'CONT')}(${fieldOf(p.key).label})`;
  const seriesDefs = measures.length ? measures : [{ key: 'total', agg: 'count' as Agg }];

  const buckets = new Map<string, {
    x: string; series: Map<string, number[]>; size: number[]; labels: number[]; colorVals: number[];
  }>();
  for (const r of data) {
    const x = xDims.length ? xDims.map((d) => String(r[d.key] ?? '')).join(' / ') : 'Total';
    const grp = grpDims.length ? grpDims.map((d) => String(r[d.key] ?? '')).join(' / ') : '';
    if (!buckets.has(x)) buckets.set(x, { x, series: new Map(), size: [], labels: [], colorVals: [] });
    const b = buckets.get(x)!;
    if (marks.size && !isDim(marks.size)) b.size.push(Number(r[marks.size.key]) || 0);
    if (marks.label && !isDim(marks.label)) b.labels.push(Number(r[marks.label.key]) || 0);
    if (marks.color && !isDim(marks.color)) b.colorVals.push(Number(r[marks.color.key]) || 0);
    for (const m of seriesDefs) {
      const name = grp ? `${grp} — ${label(m)}` : label(m);
      if (!b.series.has(name)) b.series.set(name, []);
      b.series.get(name)!.push(Number(r[m.key]) || 0);
    }
  }

  const seriesNames = new Set<string>();
  const result = [...buckets.values()].map((b) => {
    const out: Record<string, string | number> = { x: b.x };
    b.series.forEach((vals, name) => {
      seriesNames.add(name);
      const def = seriesDefs.find((m) => name.endsWith(label(m)));
      out[name] = aggValue(vals, def?.agg || 'avg');
    });
    if (b.size.length) out.__size = aggValue(b.size, marks.size?.agg || 'avg');
    if (b.colorVals.length) out.__color = aggValue(b.colorVals, marks.color?.agg || 'avg');
    if (marks.label) {
      out.__label = isDim(marks.label)
        ? b.x
        : aggValue(b.labels, marks.label.agg || 'avg');
    }
    return out;
  }).sort((a, b) => String(a.x).localeCompare(String(b.x)));

  return { chartData: result, series: [...seriesNames] };
}


/* ---------------- Pílulas / Shelves ---------------- */

const PillTag = ({ pill, onRemove, onToggleAgg }: { pill: Pill; onRemove: () => void; onToggleAgg: () => void }) => {
  const f = fieldOf(pill.key);
  const isMeasure = f.kind === 'measure';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border',
        isMeasure ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-accent border-border text-foreground'
      )}
    >
      {isMeasure && (
        <button onClick={onToggleAgg} className="uppercase opacity-70 hover:opacity-100">
          {(pill.agg || 'avg') === 'avg' ? 'MÉD' : pill.agg === 'sum' ? 'SOMA' : 'CONT'}
        </button>
      )}
      {f.label}
      <button onClick={onRemove} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </span>
  );
};

const Shelf = ({ icon: Icon, title, pills, onDrop, onRemove, onToggleAgg }: {
  icon: typeof Rows3; title: string; pills: Pill[];
  onDrop: (key: string) => void; onRemove: (i: number) => void; onToggleAgg: (i: number) => void;
}) => (
  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/field'); if (k) onDrop(k); }}
    className="flex items-start gap-2 border-b border-border px-3 py-2 min-h-[42px]"
  >
    <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-xs font-medium text-muted-foreground pt-1">
      <Icon className="w-3.5 h-3.5" />{title}
    </div>
    <div className="flex flex-wrap gap-1.5 flex-1">
      {pills.length === 0 && <span className="text-xs text-muted-foreground/60 pt-1">Arraste campos aqui</span>}
      {pills.map((p, i) => (
        <PillTag key={`${p.key}-${i}`} pill={p} onRemove={() => onRemove(i)} onToggleAgg={() => onToggleAgg(i)} />
      ))}
    </div>
  </div>
);

const MarkShelf = ({ icon: Icon, title, pill, hint, onDrop, onRemove, onToggleAgg }: {
  icon: typeof Rows3; title: string; pill?: Pill; hint: string;
  onDrop: (key: string) => void; onRemove: () => void; onToggleAgg: () => void;
}) => (
  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/field'); if (k) onDrop(k); }}
    className="flex items-center gap-2 rounded border border-dashed border-border px-2 py-1.5 min-h-[34px]"
  >
    <div className="flex items-center gap-1.5 w-20 flex-shrink-0 text-xs font-medium text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />{title}
    </div>
    <div className="flex-1 min-w-0">
      {pill
        ? <PillTag pill={pill} onRemove={onRemove} onToggleAgg={onToggleAgg} />
        : <span className="text-[11px] text-muted-foreground/60">{hint}</span>}
    </div>
  </div>
);

/* ---------------- Renderização de gráfico ---------------- */

const ChartView = ({ sheet, data, height = 340 }: { sheet: Sheet; data: Row[]; height?: number }) => {
  const marks = useMemo(
    () => ({ color: sheet.color, size: sheet.size, label: sheet.label, detail: sheet.detail }),
    [sheet.color, sheet.size, sheet.label, sheet.detail],
  );
  const { chartData, series } = useMemo(
    () => aggregate(data, sheet.cols, sheet.rows, marks),
    [data, sheet.cols, sheet.rows, marks],
  );

  const palette = paletteOf(sheet.palette);
  const colorFor = (name: string, i: number) => sheet.seriesColors?.[name] || palette[i % palette.length];
  const legendName = (name: string) => sheet.legend?.[name] || name;

  const colorIsMeasure = !!sheet.color && fieldOf(sheet.color.key).kind === 'measure';
  const colorRamp = useMemo(() => {
    if (!colorIsMeasure) return null;
    const vals = chartData.map((d) => Number(d.__color) || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    return (v: number) => {
      const t = max === min ? 0.5 : (v - min) / (max - min);
      const idx = Math.min(palette.length - 1, Math.round((1 - t) * (palette.length - 1)));
      return palette[idx];
    };
  }, [colorIsMeasure, chartData, palette]);

  const showLabels = !!sheet.label;
  const sizeIsMeasure = !!sheet.size && fieldOf(sheet.size.key).kind === 'measure';


  if (!chartData.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Arraste campos para Colunas e Linhas
      </div>
    );
  }

  if (sheet.chart === 'table') {
    return (
      <div className="overflow-auto" style={{ maxHeight: height }}>
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium">Dimensão</th>
              {series.map((s) => <th key={s} className="text-right p-2 font-medium">{legendName(s)}</th>)}
            </tr>
          </thead>
          <tbody>
            {chartData.map((r, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2">{String(r.x)}</td>
                {series.map((s) => <td key={s} className="p-2 text-right tabular-nums">{r[s] ?? '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const labelList = showLabels
    ? <LabelList dataKey="__label" position="top" style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
    : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {sheet.chart === 'line' ? (
        <LineChart data={chartData} margin={{ top: 16, right: 20, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Line key={s} type="monotone" dataKey={s} name={legendName(s)} stroke={colorFor(s, i)} strokeWidth={sizeIsMeasure ? 4 : 2}>
              {i === 0 ? labelList : null}
            </Line>
          ))}
        </LineChart>
      ) : sheet.chart === 'area' ? (
        <AreaChart data={chartData} margin={{ top: 16, right: 20, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Area key={s} type="monotone" dataKey={s} name={legendName(s)} stroke={colorFor(s, i)} strokeWidth={sizeIsMeasure ? 3 : 1} fill={colorFor(s, i)} fillOpacity={0.3}>
              {i === 0 ? labelList : null}
            </Area>
          ))}
        </AreaChart>
      ) : sheet.chart === 'pie' ? (
        <PieChart>
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie data={chartData.map((d) => ({ ...d, x: legendName(String(d.x)) }))} dataKey={series[0]} nameKey="x" outerRadius="70%"
            label={showLabels ? (e: { payload?: Record<string, unknown> }) => String(e.payload?.__label ?? '') : { fontSize: 10 }}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={colorRamp ? colorRamp(Number(d.__color) || 0) : colorFor(String(d.x), i)} />
            ))}
          </Pie>
        </PieChart>
      ) : sheet.chart === 'scatter' ? (
        <ScatterChart margin={{ top: 16, right: 20, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 10 }} />
          {sizeIsMeasure && <ZAxis dataKey="__size" range={[40, 400]} />}
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Scatter key={s} name={legendName(s)} data={chartData} dataKey={s} fill={colorFor(s, i)}>
              {colorRamp && chartData.map((d, j) => <Cell key={j} fill={colorRamp(Number(d.__color) || 0)} />)}
              {i === 0 ? labelList : null}
            </Scatter>
          ))}
        </ScatterChart>
      ) : (
        <BarChart data={chartData} layout={sheet.chart === 'barh' ? 'vertical' : 'horizontal'} margin={{ top: 16, right: 20, bottom: 40, left: sheet.chart === 'barh' ? 90 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {sheet.chart === 'barh' ? <>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="x" tick={{ fontSize: 10 }} width={90} />
          </> : <>
            <XAxis dataKey="x" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis tick={{ fontSize: 10 }} />
          </>}
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Bar key={s} dataKey={s} name={legendName(s)} fill={colorFor(s, i)} radius={[3, 3, 0, 0]}
              barSize={sizeIsMeasure ? 32 : undefined}>
              {colorRamp && chartData.map((d, j) => <Cell key={j} fill={colorRamp(Number(d.__color) || 0)} />)}
              {showLabels && <LabelList dataKey="__label" position={sheet.chart === 'barh' ? 'right' : 'top'} style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />}
            </Bar>
          ))}
        </BarChart>
      )}

    </ResponsiveContainer>
  );
};

/* ---------------- Componente principal ---------------- */

type TabRef = { kind: 'sheet' | 'dashboard' | 'story'; id: string };

interface AnaliseRow {
  id: string; nome: string; descricao: string | null; updated_at: string;
  workbook: { sheets?: Sheet[]; dashboards?: Dashboard[]; stories?: Story[] };
}

const AnaliseSection = () => {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openField, setOpenField] = useState<string | null>(null);

  const [sheets, setSheets] = useState<Sheet[]>([newSheet(1)]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [active, setActive] = useState<TabRef>({ kind: 'sheet', id: '' });

  /* lista de análises salvas */
  const [analises, setAnalises] = useState<AnaliseRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [newName, setNewName] = useState('');

  const fetchAnalises = useCallback(async () => {
    const { data: rows } = await supabase.from('analises')
      .select('id, nome, descricao, updated_at, workbook').order('updated_at', { ascending: false });
    if (rows) setAnalises(rows as unknown as AnaliseRow[]);
  }, []);

  useEffect(() => { fetchAnalises(); }, [fetchAnalises]);

  const current = analises.find((a) => a.id === currentId) || null;

  const openAnalise = (a: AnaliseRow) => {
    const wb = a.workbook || {};
    setSheets(wb.sheets?.length ? wb.sheets : [newSheet(1)]);
    setDashboards(wb.dashboards || []);
    setStories(wb.stories || []);
    setActive({ kind: 'sheet', id: '' });
    setCurrentId(a.id);
    setSavingState('idle');
  };

  const createAnalise = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const nome = newName.trim() || `Análise ${analises.length + 1}`;
    const wb = { sheets: [newSheet(1)], dashboards: [], stories: [] };
    const { data: row } = await supabase.from('analises')
      .insert({ user_id: auth.user.id, nome, workbook: wb as never })
      .select('id, nome, descricao, updated_at, workbook').single();
    if (row) {
      setNewName('');
      setAnalises((p) => [row as unknown as AnaliseRow, ...p]);
      openAnalise(row as unknown as AnaliseRow);
    }
  };

  const duplicateAnalise = async (a: AnaliseRow) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: row } = await supabase.from('analises')
      .insert({ user_id: auth.user.id, nome: `${a.nome} (cópia)`, descricao: a.descricao, workbook: a.workbook as never })
      .select('id, nome, descricao, updated_at, workbook').single();
    if (row) setAnalises((p) => [row as unknown as AnaliseRow, ...p]);
  };

  const renameAnalise = async (a: AnaliseRow, nome: string) => {
    setAnalises((p) => p.map((x) => (x.id === a.id ? { ...x, nome } : x)));
    await supabase.from('analises').update({ nome }).eq('id', a.id);
  };

  const deleteAnalise = async (a: AnaliseRow) => {
    setAnalises((p) => p.filter((x) => x.id !== a.id));
    if (currentId === a.id) setCurrentId(null);
    await supabase.from('analises').delete().eq('id', a.id);
  };

  /* autosave da análise aberta */
  useEffect(() => {
    if (!currentId) return;
    setSavingState('saving');
    const t = setTimeout(async () => {
      const wb = { sheets, dashboards, stories };
      await supabase.from('analises').update({ workbook: wb as never }).eq('id', currentId);
      setAnalises((p) => p.map((x) => (x.id === currentId ? { ...x, workbook: wb, updated_at: new Date().toISOString() } : x)));
      setSavingState('saved');
    }, 800);
    return () => clearTimeout(t);
  }, [sheets, dashboards, stories, currentId]);

  /* backup local */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sheets, dashboards, stories }));
  }, [sheets, dashboards, stories]);

  useEffect(() => {
    if (!active.id && sheets.length) setActive({ kind: 'sheet', id: sheets[0].id });
  }, [sheets, active.id]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    let all: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data: rows, error } = await supabase.from('resultados').select('*').range(from, from + PAGE - 1);
      if (error || !rows || rows.length === 0) break;
      all = all.concat(rows);
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    setData(all.map((r: any) => ({
      semestre: r.semestre, nivel: r.nivel, curso: r.curso, dimensao: r.dimensao, area: r.area,
      textoQuestao: r.texto_questao, conceito: r.conceito, tipoAvaliacao: r.tipo_avaliacao,
      excelente: r.excelente, bom: r.bom, atendeParcialmente: r.atende_parcialmente,
      regular: r.regular, muitoRuim: r.muito_ruim, naoSeAplica: r.nao_se_aplica,
      total: r.total, media: Number(r.media),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sheet = sheets.find((s) => s.id === active.id);
  const dashboard = dashboards.find((d) => d.id === active.id);
  const story = stories.find((s) => s.id === active.id);

  const updateSheet = (id: string, patch: Partial<Sheet>) =>
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const distinct = useCallback((key: string) =>
    [...new Set(data.map((r) => String(r[key] ?? '')).filter(Boolean))].sort(), [data]);

  const sheetData = useMemo(() => {
    if (!sheet) return [];
    return data.filter((r) => sheet.filters.every((f) => !f.values.length || f.values.includes(String(r[f.key] ?? ''))));
  }, [data, sheet]);

  const dashSheetData = useCallback((s: Sheet) =>
    data.filter((r) => s.filters.every((f) => !f.values.length || f.values.includes(String(r[f.key] ?? '')))), [data]);

  /* ações de shelves */
  const addToShelf = (target: 'cols' | 'rows', key: string) => {
    if (!sheet) return;
    const f = fieldOf(key);
    const pill: Pill = { key, agg: f.kind === 'measure' ? (key === 'media' ? 'avg' : 'sum') : undefined };
    updateSheet(sheet.id, { [target]: [...sheet[target], pill] } as Partial<Sheet>);
  };
  const addFilter = (key: string) => {
    if (!sheet || sheet.filters.some((f) => f.key === key)) return;
    updateSheet(sheet.id, { filters: [...sheet.filters, { key, values: [] }] });
  };
  const setMark = (slot: MarkSlot, key: string) => {
    if (!sheet) return;
    const f = fieldOf(key);
    const pill: Pill = { key, agg: f.kind === 'measure' ? (key === 'media' ? 'avg' : 'sum') : undefined };
    updateSheet(sheet.id, { [slot]: pill } as Partial<Sheet>);
  };

  /* séries atuais (para editar legenda e cores) */
  const sheetSeries = useMemo(() => {
    if (!sheet) return [] as string[];
    if (sheet.chart === 'pie') {
      const { chartData } = aggregate(sheetData, sheet.cols, sheet.rows, {
        color: sheet.color, size: sheet.size, label: sheet.label, detail: sheet.detail,
      });
      return chartData.map((d) => String(d.x));
    }
    const { series } = aggregate(sheetData, sheet.cols, sheet.rows, {
      color: sheet.color, size: sheet.size, label: sheet.label, detail: sheet.detail,
    });
    return series;
  }, [sheet, sheetData]);

  /* duplicar abas */
  const duplicateSheet = (s: Sheet) => {
    const copy: Sheet = { ...JSON.parse(JSON.stringify(s)), id: uid(), name: `${s.name} (cópia)` };
    setSheets((prev) => [...prev, copy]);
    setActive({ kind: 'sheet', id: copy.id });
  };
  const duplicateDashboard = (d: Dashboard) => {
    const copy: Dashboard = { ...d, id: uid(), name: `${d.name} (cópia)`, sheetIds: [...d.sheetIds] };
    setDashboards((prev) => [...prev, copy]);
    setActive({ kind: 'dashboard', id: copy.id });
  };
  const duplicateStory = (st: Story) => {
    const copy: Story = { ...st, id: uid(), name: `${st.name} (cópia)`, points: st.points.map((p) => ({ ...p, id: uid() })) };
    setStories((prev) => [...prev, copy]);
    setActive({ kind: 'story', id: copy.id });
  };


  /* ---------- Lista de análises salvas ---------- */
  if (!currentId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Análise</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Suas análises salvas — planilhas, painéis e histórias ficam guardados no sistema
          </p>
        </div>

        <Card className="p-4 flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nome da nova análise</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Avaliação Discentes 2026.1" className="h-9" />
          </div>
          <Button onClick={createAnalise} className="h-9">
            <Plus className="w-4 h-4 mr-1" /> Nova análise
          </Button>
        </Card>

        {analises.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma análise criada ainda. Crie a primeira acima.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analises.map((a) => {
              const wb = a.workbook || {};
              return (
                <Card key={a.id} className="p-4 space-y-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <button className="text-left font-medium text-sm hover:text-primary line-clamp-2"
                      onClick={() => openAnalise(a)}>{a.nome}</button>
                    <button onClick={() => deleteAnalise(a)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" />{wb.sheets?.length || 0} planilhas</span>
                    <span className="flex items-center gap-1"><Presentation className="w-3 h-3" />{wb.dashboards?.length || 0} painéis</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{wb.stories?.length || 0} histórias</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Atualizado em {new Date(a.updated_at).toLocaleString('pt-BR')}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => openAnalise(a)}>Abrir</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => duplicateAnalise(a)}>Duplicar</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="h-7 px-1 text-xs text-muted-foreground -ml-1"
            onClick={() => { setCurrentId(null); fetchAnalises(); }}>
            ← Todas as análises
          </Button>
          <Input value={current?.nome ?? ''}
            onChange={(e) => current && renameAnalise(current, e.target.value)}
            className="h-9 text-lg font-heading font-bold border-transparent px-1 focus-visible:border-input" />
        </div>
        <span className="text-xs text-muted-foreground">
          {savingState === 'saving' ? 'Salvando…' : savingState === 'saved' ? 'Salvo automaticamente' : ''}
        </span>
      </div>


      <Card className="overflow-hidden">
        <div className="flex" style={{ minHeight: 560 }}>
          {/* Painel de dados */}
          <div className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
            <div className="px-3 py-2 border-b border-border text-xs font-semibold">
              Dados <span className="text-muted-foreground font-normal">({data.length} registros)</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-3">
                {(['dim', 'measure'] as Kind[]).map((kind) => (
                  <div key={kind}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 mb-1">
                      {kind === 'dim' ? 'Dimensões' : 'Medidas'}
                    </p>
                    {FIELDS.filter((f) => f.kind === kind).map((f) => {
                      const open = openField === f.key;
                      const values = f.kind === 'dim' ? distinct(f.key) : [];
                      const nums = f.kind === 'measure' ? data.map((r) => Number(r[f.key]) || 0) : [];
                      return (
                        <div key={f.key}>
                          <div
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/field', f.key)}
                            onDoubleClick={() => addToShelf(f.kind === 'dim' ? 'cols' : 'rows', f.key)}
                            className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs cursor-grab hover:bg-accent"
                          >
                            <button onClick={() => setOpenField(open ? null : f.key)} className="text-muted-foreground hover:text-foreground">
                              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <span className={cn('text-[10px] font-bold', f.kind === 'dim' ? 'text-muted-foreground' : 'text-primary')}>
                              {f.kind === 'dim' ? 'Abc' : '#'}
                            </span>
                            <span className="truncate flex-1">{f.label}</span>
                            {f.kind === 'dim' && (
                              <span className="text-[9px] text-muted-foreground tabular-nums">{values.length}</span>
                            )}
                          </div>
                          {open && (
                            <div className="ml-5 mb-1 rounded border border-border bg-background/60 p-1.5 space-y-0.5 max-h-40 overflow-auto">
                              {f.kind === 'measure' ? (
                                <p className="text-[10px] text-muted-foreground">
                                  mín {nums.length ? Math.min(...nums).toFixed(2) : '-'} · máx {nums.length ? Math.max(...nums).toFixed(2) : '-'}
                                </p>
                              ) : values.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground">Sem valores</p>
                              ) : (
                                <>
                                  {values.slice(0, 50).map((v) => (
                                    <p key={v} className="text-[10px] text-muted-foreground line-clamp-2" title={v}>{v}</p>
                                  ))}
                                  {values.length > 50 && (
                                    <p className="text-[10px] text-muted-foreground/70">+{values.length - 50} valores…</p>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área central */}
          <div className="flex-1 flex flex-col min-w-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados...
              </div>
            ) : sheet ? (
              <>
                <Shelf icon={Filter} title="Filtros" pills={sheet.filters.map((f) => ({ key: f.key }))}
                  onDrop={addFilter}
                  onRemove={(i) => updateSheet(sheet.id, { filters: sheet.filters.filter((_, x) => x !== i) })}
                  onToggleAgg={() => {}} />
                <Shelf icon={Columns3} title="Colunas" pills={sheet.cols}
                  onDrop={(k) => addToShelf('cols', k)}
                  onRemove={(i) => updateSheet(sheet.id, { cols: sheet.cols.filter((_, x) => x !== i) })}
                  onToggleAgg={(i) => updateSheet(sheet.id, {
                    cols: sheet.cols.map((p, x) => x === i ? { ...p, agg: p.agg === 'avg' ? 'sum' : p.agg === 'sum' ? 'count' : 'avg' } : p),
                  })} />
                <Shelf icon={Rows3} title="Linhas" pills={sheet.rows}
                  onDrop={(k) => addToShelf('rows', k)}
                  onRemove={(i) => updateSheet(sheet.id, { rows: sheet.rows.filter((_, x) => x !== i) })}
                  onToggleAgg={(i) => updateSheet(sheet.id, {
                    rows: sheet.rows.map((p, x) => x === i ? { ...p, agg: p.agg === 'avg' ? 'sum' : p.agg === 'sum' ? 'count' : 'avg' } : p),
                  })} />

                <div className="px-3 py-2 border-b border-border bg-muted/20">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Marcas</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {([
                      { slot: 'color' as MarkSlot, title: 'Cor', icon: Palette, hint: 'Arraste para colorir' },
                      { slot: 'size' as MarkSlot, title: 'Tamanho', icon: Ruler, hint: 'Arraste uma medida' },
                      { slot: 'label' as MarkSlot, title: 'Rótulo', icon: Tag, hint: 'Arraste para exibir rótulos' },
                      { slot: 'detail' as MarkSlot, title: 'Detalhe', icon: Layers, hint: 'Arraste para detalhar' },
                    ]).map((m) => (
                      <MarkShelf key={m.slot} icon={m.icon} title={m.title} hint={m.hint} pill={sheet[m.slot]}
                        onDrop={(k) => setMark(m.slot, k)}
                        onRemove={() => updateSheet(sheet.id, { [m.slot]: undefined } as Partial<Sheet>)}
                        onToggleAgg={() => {
                          const p = sheet[m.slot];
                          if (!p) return;
                          updateSheet(sheet.id, {
                            [m.slot]: { ...p, agg: p.agg === 'avg' ? 'sum' : p.agg === 'sum' ? 'count' : 'avg' },
                          } as Partial<Sheet>);
                        }} />
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-4 min-w-0">
                  <Input
                    value={sheet.name}
                    onChange={(e) => updateSheet(sheet.id, { name: e.target.value })}
                    className="border-0 shadow-none px-0 text-base font-heading font-semibold h-8 focus-visible:ring-0"
                  />
                  <ChartView sheet={sheet} data={sheetData} />
                </div>

              </>
            ) : dashboard ? (
              <div className="flex-1 p-4 space-y-3">
                <Input value={dashboard.name}
                  onChange={(e) => setDashboards((prev) => prev.map((d) => d.id === dashboard.id ? { ...d, name: e.target.value } : d))}
                  className="border-0 shadow-none px-0 text-base font-heading font-semibold h-8 focus-visible:ring-0" />
                <div className="flex flex-wrap gap-3 text-xs">
                  {sheets.map((s) => (
                    <label key={s.id} className="flex items-center gap-1.5">
                      <Checkbox checked={dashboard.sheetIds.includes(s.id)}
                        onCheckedChange={(v) => setDashboards((prev) => prev.map((d) => d.id === dashboard.id ? {
                          ...d, sheetIds: v ? [...d.sheetIds, s.id] : d.sheetIds.filter((x) => x !== s.id),
                        } : d))} />
                      {s.name}
                    </label>
                  ))}
                </div>
                {dashboard.sheetIds.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded">
                    Selecione as planilhas para compor o painel
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {dashboard.sheetIds.map((id) => {
                      const s = sheets.find((x) => x.id === id);
                      if (!s) return null;
                      return (
                        <Card key={id} className="p-3">
                          <p className="text-xs font-semibold mb-2">{s.name}</p>
                          <ChartView sheet={s} data={dashSheetData(s)} height={260} />
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : story ? (
              <div className="flex-1 p-4 space-y-3">
                <Input value={story.name}
                  onChange={(e) => setStories((prev) => prev.map((s) => s.id === story.id ? { ...s, name: e.target.value } : s))}
                  className="border-0 shadow-none px-0 text-base font-heading font-semibold h-8 focus-visible:ring-0" />
                <Button size="sm" variant="outline" onClick={() => setStories((prev) => prev.map((s) => s.id === story.id ? {
                  ...s, points: [...s.points, { id: uid(), sheetId: sheets[0]?.id || '', caption: 'Novo ponto da história' }],
                } : s))}>
                  <Plus className="w-4 h-4 mr-1" /> Novo ponto
                </Button>
                {story.points.length === 0 && (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded">
                    Adicione pontos para montar a história
                  </div>
                )}
                <div className="space-y-4">
                  {story.points.map((p, idx) => {
                    const s = sheets.find((x) => x.id === p.sheetId);
                    return (
                      <Card key={p.id} className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                          <Input value={p.caption} placeholder="Legenda"
                            onChange={(e) => setStories((prev) => prev.map((st) => st.id === story.id ? {
                              ...st, points: st.points.map((pt) => pt.id === p.id ? { ...pt, caption: e.target.value } : pt),
                            } : st))} className="h-8 text-xs" />
                          <select value={p.sheetId} className="h-8 text-xs rounded border border-border bg-background px-2"
                            onChange={(e) => setStories((prev) => prev.map((st) => st.id === story.id ? {
                              ...st, points: st.points.map((pt) => pt.id === p.id ? { ...pt, sheetId: e.target.value } : pt),
                            } : st))}>
                            {sheets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => setStories((prev) => prev.map((st) => st.id === story.id ? {
                              ...st, points: st.points.filter((pt) => pt.id !== p.id),
                            } : st))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {s && <ChartView sheet={s} data={dashSheetData(s)} height={240} />}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Painel direito: marcas / filtros */}
          {sheet && (
            <div className="w-56 flex-shrink-0 border-l border-border bg-muted/30">
              <div className="px-3 py-2 border-b border-border text-xs font-semibold">Marcas</div>
              <div className="p-2 grid grid-cols-4 gap-1">
                {CHART_TYPES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button key={c.type} title={c.label} onClick={() => updateSheet(sheet.id, { chart: c.type })}
                      className={cn('aspect-square rounded flex items-center justify-center border',
                        sheet.chart === c.type ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent')}>
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 border-y border-border text-xs font-semibold">Cores</div>
              <div className="p-2 space-y-2">
                {PALETTES.map((p) => (
                  <button key={p.id} onClick={() => updateSheet(sheet.id, { palette: p.id, seriesColors: {} })}
                    className={cn('w-full flex items-center gap-2 rounded border px-1.5 py-1 text-[11px]',
                      (sheet.palette || 'default') === p.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent')}>
                    <span className="flex gap-0.5">
                      {p.colors.map((c) => <span key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />)}
                    </span>
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="px-3 py-2 border-y border-border text-xs font-semibold">Legenda</div>
              <ScrollArea className="max-h-56">
                <div className="p-2 space-y-2">
                  {sheetSeries.length === 0 && <p className="text-xs text-muted-foreground">Monte o gráfico para editar a legenda</p>}
                  {sheetSeries.slice(0, 20).map((s, i) => (
                    <div key={s} className="space-y-1">
                      <Input value={sheet.legend?.[s] ?? s}
                        onChange={(e) => updateSheet(sheet.id, { legend: { ...(sheet.legend || {}), [s]: e.target.value } })}
                        className="h-7 text-[11px]" />
                      <div className="flex gap-1 flex-wrap">
                        {paletteOf(sheet.palette).map((c) => {
                          const activeColor = (sheet.seriesColors?.[s] || paletteOf(sheet.palette)[i % paletteOf(sheet.palette).length]) === c;
                          return (
                            <button key={c} title="Aplicar cor"
                              onClick={() => updateSheet(sheet.id, { seriesColors: { ...(sheet.seriesColors || {}), [s]: c } })}
                              className={cn('w-4 h-4 rounded-sm border', activeColor ? 'border-foreground' : 'border-transparent')}
                              style={{ backgroundColor: c }} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="px-3 py-2 border-y border-border text-xs font-semibold">Valores do filtro</div>
              <ScrollArea className="h-72">
                <div className="p-2 space-y-3">
                  {sheet.filters.length === 0 && <p className="text-xs text-muted-foreground">Arraste campos para Filtros</p>}
                  {sheet.filters.map((f) => (
                    <div key={f.key}>
                      <Label className="text-[11px]">{fieldOf(f.key).label}</Label>
                      <div className="mt-1 space-y-1">
                        {distinct(f.key).slice(0, 60).map((v) => (
                          <label key={v} className="flex items-start gap-1.5 text-[11px]">
                            <Checkbox className="mt-0.5" checked={f.values.includes(v)}
                              onCheckedChange={(c) => updateSheet(sheet.id, {
                                filters: sheet.filters.map((x) => x.key === f.key ? {
                                  ...x, values: c ? [...x.values, v] : x.values.filter((y) => y !== v),
                                } : x),
                              })} />
                            <span className="line-clamp-2">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Barra de abas inferior */}
        <div className="flex items-center gap-1 border-t border-border bg-muted/50 px-2 py-1 overflow-x-auto">
          {sheets.map((s) => (
            <TabButton key={s.id} icon={FileSpreadsheet} label={s.name}
              activeTab={active.kind === 'sheet' && active.id === s.id}
              onClick={() => setActive({ kind: 'sheet', id: s.id })}
              onDuplicate={() => duplicateSheet(s)}
              onDelete={sheets.length > 1 ? () => {
                setSheets((prev) => prev.filter((x) => x.id !== s.id));
                if (active.id === s.id) setActive({ kind: 'sheet', id: '' });
              } : undefined} />
          ))}
          {dashboards.map((d) => (
            <TabButton key={d.id} icon={Presentation} label={d.name}
              activeTab={active.kind === 'dashboard' && active.id === d.id}
              onClick={() => setActive({ kind: 'dashboard', id: d.id })}
              onDuplicate={() => duplicateDashboard(d)}
              onDelete={() => { setDashboards((p) => p.filter((x) => x.id !== d.id)); setActive({ kind: 'sheet', id: '' }); }} />
          ))}
          {stories.map((s) => (
            <TabButton key={s.id} icon={BookOpen} label={s.name}
              activeTab={active.kind === 'story' && active.id === s.id}
              onClick={() => setActive({ kind: 'story', id: s.id })}
              onDuplicate={() => duplicateStory(s)}
              onDelete={() => { setStories((p) => p.filter((x) => x.id !== s.id)); setActive({ kind: 'sheet', id: '' }); }} />
          ))}

          <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
              const s = newSheet(sheets.length + 1);
              setSheets((prev) => [...prev, s]); setActive({ kind: 'sheet', id: s.id });
            }}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Planilha
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
              const d: Dashboard = { id: uid(), name: `Painel ${dashboards.length + 1}`, sheetIds: sheets.map((s) => s.id).slice(0, 2) };
              setDashboards((prev) => [...prev, d]); setActive({ kind: 'dashboard', id: d.id });
            }}>
              <Presentation className="w-3.5 h-3.5 mr-1" /> Painel
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
              const st: Story = { id: uid(), name: `História ${stories.length + 1}`, points: [] };
              setStories((prev) => [...prev, st]); setActive({ kind: 'story', id: st.id });
            }}>
              <BookOpen className="w-3.5 h-3.5 mr-1" /> História
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const TabButton = ({ icon: Icon, label, activeTab, onClick, onDelete }: {
  icon: typeof FileSpreadsheet; label: string; activeTab: boolean; onClick: () => void; onDelete?: () => void;
}) => (
  <div className={cn('group flex items-center gap-1 rounded-t px-2 py-1 text-xs cursor-pointer whitespace-nowrap border-b-2',
    activeTab ? 'bg-background border-primary font-medium' : 'border-transparent hover:bg-accent')}
    onClick={onClick}>
    <Icon className="w-3.5 h-3.5" />
    {label}
    {onDelete && (
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-60 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default AnaliseSection;
