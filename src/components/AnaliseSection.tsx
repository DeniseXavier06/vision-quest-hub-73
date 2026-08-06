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
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  BarChart3, BarChartHorizontal, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon,
  Table as TableIcon, ScatterChart as ScatterIcon, Plus, X, Filter, Rows3, Columns3,
  Presentation, BookOpen, FileSpreadsheet, Trash2, Loader2,
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
}
interface Dashboard { id: string; name: string; sheetIds: string[] }
interface StoryPoint { id: string; sheetId: string; caption: string }
interface Story { id: string; name: string; points: StoryPoint[] }

interface Row { [k: string]: string | number }

const uid = () => Math.random().toString(36).slice(2, 9);
const newSheet = (n: number): Sheet => ({
  id: uid(), name: `Planilha ${n}`, cols: [], rows: [], filters: [], chart: 'bar',
});

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
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

  const colorIsMeasure = !!sheet.color && fieldOf(sheet.color.key).kind === 'measure';
  const colorRamp = useMemo(() => {
    if (!colorIsMeasure) return null;
    const vals = chartData.map((d) => Number(d.__color) || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    return (v: number) => {
      const t = max === min ? 0.5 : (v - min) / (max - min);
      return `hsl(var(--chart-1) / ${(0.35 + t * 0.65).toFixed(2)})`;
    };
  }, [colorIsMeasure, chartData]);

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
              {series.map((s) => <th key={s} className="text-right p-2 font-medium">{s}</th>)}
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
            <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={sizeIsMeasure ? 4 : 2}>
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
            <Area key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={sizeIsMeasure ? 3 : 1} fill={COLORS[i % COLORS.length]} fillOpacity={0.3}>
              {i === 0 ? labelList : null}
            </Area>
          ))}
        </AreaChart>
      ) : sheet.chart === 'pie' ? (
        <PieChart>
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie data={chartData} dataKey={series[0]} nameKey="x" outerRadius="70%"
            label={showLabels ? (e: { payload?: Record<string, unknown> }) => String(e.payload?.__label ?? '') : { fontSize: 10 }}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={colorRamp ? colorRamp(Number(d.__color) || 0) : COLORS[i % COLORS.length]} />
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
            <Scatter key={s} name={s} data={chartData} dataKey={s} fill={COLORS[i % COLORS.length]}>
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
            <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]}
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

const AnaliseSection = () => {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [sheets, setSheets] = useState<Sheet[]>([newSheet(1)]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [active, setActive] = useState<TabRef>({ kind: 'sheet', id: '' });

  /* persistência local */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const wb = JSON.parse(raw);
        if (wb.sheets?.length) setSheets(wb.sheets);
        if (wb.dashboards) setDashboards(wb.dashboards);
        if (wb.stories) setStories(wb.stories);
      }
    } catch { /* ignora */ }
  }, []);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Análise</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Construtor de gráficos, painéis e histórias a partir dos resultados das avaliações
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex" style={{ minHeight: 560 }}>
          {/* Painel de dados */}
          <div className="w-56 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
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
                    {FIELDS.filter((f) => f.kind === kind).map((f) => (
                      <div
                        key={f.key}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/field', f.key)}
                        onDoubleClick={() => addToShelf(f.kind === 'dim' ? 'cols' : 'rows', f.key)}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs cursor-grab hover:bg-accent"
                      >
                        <span className={cn('text-[10px] font-bold', f.kind === 'dim' ? 'text-muted-foreground' : 'text-primary')}>
                          {f.kind === 'dim' ? 'Abc' : '#'}
                        </span>
                        <span className="truncate">{f.label}</span>
                      </div>
                    ))}
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
              onDelete={sheets.length > 1 ? () => {
                setSheets((prev) => prev.filter((x) => x.id !== s.id));
                if (active.id === s.id) setActive({ kind: 'sheet', id: '' });
              } : undefined} />
          ))}
          {dashboards.map((d) => (
            <TabButton key={d.id} icon={Presentation} label={d.name}
              activeTab={active.kind === 'dashboard' && active.id === d.id}
              onClick={() => setActive({ kind: 'dashboard', id: d.id })}
              onDelete={() => { setDashboards((p) => p.filter((x) => x.id !== d.id)); setActive({ kind: 'sheet', id: '' }); }} />
          ))}
          {stories.map((s) => (
            <TabButton key={s.id} icon={BookOpen} label={s.name}
              activeTab={active.kind === 'story' && active.id === s.id}
              onClick={() => setActive({ kind: 'story', id: s.id })}
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
