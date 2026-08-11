import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Copy, Play, X, ChevronLeft, ChevronRight, Save, FilePlus2,
  Maximize2, RotateCcw, FileSpreadsheet, Presentation, Type as TypeIcon,
} from 'lucide-react';

/* ---------------- Tipos ---------------- */

export type SortMode = 'default' | 'az' | 'za' | 'valAsc' | 'valDesc';
export const SORT_LABEL: Record<SortMode, string> = {
  default: 'Padrão', az: 'Rótulo (A→Z)', za: 'Rótulo (Z→A)',
  valAsc: 'Valor (crescente)', valDesc: 'Valor (decrescente)',
};

export interface StoryFilterOverride { key: string; values: string[] }

export interface StoryPoint {
  id: string;
  name?: string;
  kind?: 'sheet' | 'dashboard' | 'blank';
  sheetId: string;                 // vínculo com a planilha original (RF-43)
  dashboardId?: string;
  caption: string;                 // legenda / resumo (RF-45)
  comment?: string;                // comentários (RF-46)
  filters?: StoryFilterOverride[]; // filtros do ponto (RF-47)
  sort?: SortMode;                 // classificação do ponto (RF-47)
  fitStorySize?: boolean;          // ajustar painel ao tamanho da história (RF-56)
}

export interface StoryFormat {
  shading: string;
  titleShow: boolean;
  titleSize: number;
  titleColor: string;
  align: 'left' | 'center' | 'right';
  textSize: number;
  textColor: string;
}

export interface Story {
  id: string;
  name: string;
  points: StoryPoint[];
  sizePreset?: string;
  width?: number;
  height?: number;
  nav?: 'caption' | 'numbers' | 'dots';
  showArrows?: boolean;
  captionWidth?: number;
  captionHeight?: number;
  format?: StoryFormat;
}

export const SIZE_PRESETS: { id: string; label: string; w: number; h: number }[] = [
  { id: 'padrao', label: 'Padrão (1024×768)', w: 1024, h: 768 },
  { id: 'wide', label: 'Widescreen (1366×768)', w: 1366, h: 768 },
  { id: 'grande', label: 'Grande (1600×900)', w: 1600, h: 900 },
  { id: 'custom', label: 'Personalizado', w: 1200, h: 800 },
];

export const defaultFormat = (): StoryFormat => ({
  shading: 'transparent', titleShow: true, titleSize: 18, titleColor: 'hsl(var(--foreground))',
  align: 'left', textSize: 13, textColor: 'hsl(var(--muted-foreground))',
});

export const newStoryPoint = (id: string, sheetId: string, n: number): StoryPoint => ({
  id, name: `Ponto ${n}`, kind: sheetId ? 'sheet' : 'blank', sheetId,
  caption: `Ponto ${n}`, comment: '', filters: [], sort: 'default', fitStorySize: false,
});

export const storyDims = (st: Story) => {
  const preset = SIZE_PRESETS.find((p) => p.id === (st.sizePreset || 'wide')) || SIZE_PRESETS[1];
  return st.sizePreset === 'custom'
    ? { w: st.width || preset.w, h: st.height || preset.h }
    : { w: preset.w, h: preset.h };
};

/* ---------------- Componente ---------------- */

interface Props {
  story: Story;
  onChange: (patch: Partial<Story>) => void;
  sheets: { id: string; name: string; filters: { key: string; values: string[] }[] }[];
  dashboards: { id: string; name: string; sheetIds: string[] }[];
  fieldLabel: (key: string) => string;
  fieldKeys: string[];
  distinct: (key: string) => string[];
  renderChart: (sheetId: string, opts: { height: number; filters?: StoryFilterOverride[]; sort?: SortMode }) => React.ReactNode;
  uid: () => string;
}

const StoryBoard = ({ story, onChange, sheets, dashboards, fieldLabel, fieldKeys, distinct, renderChart, uid }: Props) => {
  const points = story.points;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [draft, setDraft] = useState<StoryPoint | null>(null);
  const [presenting, setPresenting] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const idx = Math.min(currentIdx, Math.max(0, points.length - 1));
  const point = points[idx];
  const format = story.format || defaultFormat();
  const dims = storyDims(story);
  const dirty = !!draft && !!point && JSON.stringify(draft) !== JSON.stringify(point);

  useEffect(() => { setDraft(point ? { ...point } : null); }, [point?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPoints = (fn: (p: StoryPoint[]) => StoryPoint[]) => onChange({ points: fn(points) });

  /* RF-39 / RF-49: novo ponto (com planilha ou em branco) */
  const addPoint = (sheetId: string) => {
    const p = newStoryPoint(uid(), sheetId, points.length + 1);
    setPoints((prev) => [...prev, p]);
    setCurrentIdx(points.length);
  };
  const addDashboardPoint = (dashboardId: string) => {
    const p = { ...newStoryPoint(uid(), '', points.length + 1), kind: 'dashboard' as const, dashboardId, fitStorySize: true };
    setPoints((prev) => [...prev, p]);
    setCurrentIdx(points.length);
  };
  /* RF-51 */
  const duplicatePoint = (p: StoryPoint) => {
    setPoints((prev) => {
      const at = prev.findIndex((x) => x.id === p.id);
      const copy = { ...JSON.parse(JSON.stringify(p)), id: uid(), name: `${p.name || p.caption} (cópia)` };
      const next = [...prev]; next.splice(at + 1, 0, copy); return next;
    });
    setCurrentIdx(idx + 1);
  };
  /* RF-52 */
  const deletePoint = (p: StoryPoint) => {
    setPoints((prev) => prev.filter((x) => x.id !== p.id));
    setCurrentIdx(Math.max(0, idx - 1));
  };
  /* RF-48 */
  const updatePoint = () => {
    if (!draft) return;
    setPoints((prev) => prev.map((x) => (x.id === draft.id ? draft : x)));
  };
  /* RF-50 */
  const saveAsNew = () => {
    if (!draft) return;
    const copy = { ...JSON.parse(JSON.stringify(draft)), id: uid(), name: `${draft.name || draft.caption} (novo)` };
    setPoints((prev) => [...prev, copy]);
    setCurrentIdx(points.length);
  };

  const patchDraft = (patch: Partial<StoryPoint>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  /* navegação */
  const go = (delta: number) => setCurrentIdx((i) => Math.min(points.length - 1, Math.max(0, i + delta)));

  /* RF-59 / RF-61 */
  const startPresenting = async () => {
    setPresenting(true);
    try { await shellRef.current?.requestFullscreen?.(); } catch { /* fullscreen opcional */ }
  };
  const stopPresenting = async () => {
    setPresenting(false);
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  };
  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setPresenting(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);
  /* RF-60 */
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      if (e.key === 'Escape') stopPresenting();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, points.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* conteúdo do ponto — sempre lê a planilha original (RF-43 / RF-44) */
  const renderPoint = (p: StoryPoint, height: number) => {
    const kind = p.kind || (p.sheetId ? 'sheet' : 'blank');
    if (kind === 'dashboard') {
      const dash = dashboards.find((d) => d.id === p.dashboardId);
      if (!dash) return <Empty text="Painel não encontrado" />;
      const ids = dash.sheetIds;
      return (
        <div className="grid gap-3 md:grid-cols-2" style={p.fitStorySize ? { maxWidth: dims.w } : undefined}>
          {ids.map((sid) => (
            <Card key={sid} className="p-2">
              <p className="text-[11px] font-semibold mb-1">{sheets.find((s) => s.id === sid)?.name}</p>
              {renderChart(sid, { height: Math.max(160, height / Math.max(1, Math.ceil(ids.length / 2))), filters: p.filters, sort: p.sort })}
            </Card>
          ))}
        </div>
      );
    }
    if (kind === 'blank' || !p.sheetId) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
          Ponto em branco — adicione uma planilha ou use apenas texto
        </div>
      );
    }
    const s = sheets.find((x) => x.id === p.sheetId);
    if (!s) return <Empty text="Planilha não encontrada" />;
    return renderChart(p.sheetId, { height, filters: p.filters, sort: p.sort });
  };

  const stage = (p: StoryPoint | undefined, height: number, big = false) => (
    <div className="rounded p-4" style={{ background: format.shading, textAlign: format.align }}>
      {format.titleShow && (
        <h3 className="font-heading font-bold" style={{ fontSize: format.titleSize, color: format.titleColor }}>
          {story.name}
        </h3>
      )}
      {p ? (
        <>
          {p.caption && (
            <p className="mt-1" style={{ fontSize: format.textSize, color: format.textColor }}>{p.caption}</p>
          )}
          <div className="mt-3" style={{ textAlign: 'left' }}>{renderPoint(p, height)}</div>
          {p.comment && (
            <p className="mt-3 whitespace-pre-wrap rounded bg-muted/40 px-3 py-2"
              style={{ fontSize: format.textSize, color: format.textColor, textAlign: format.align }}>
              {p.comment}
            </p>
          )}
        </>
      ) : <Empty text="Nenhum ponto na história" />}
      {big && <div className="h-2" />}
    </div>
  );

  /* navegador de pontos (RF-53 / RF-54 / RF-55) */
  const navigator = (
    <div className="flex items-center gap-2">
      {story.showArrows !== false && (
        <Button size="icon" variant="outline" className="h-8 w-8 flex-shrink-0" onClick={() => go(-1)} disabled={idx <= 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
      <div className="flex flex-1 items-stretch gap-1.5 overflow-x-auto pb-1">
        {points.map((p, i) => {
          const nav = story.nav || 'caption';
          const isActive = i === idx;
          if (nav === 'dots') {
            return (
              <button key={p.id} title={p.caption} onClick={() => setCurrentIdx(i)}
                className={cn('h-3 w-3 rounded-full self-center border', isActive ? 'bg-primary border-primary' : 'border-border hover:bg-accent')} />
            );
          }
          if (nav === 'numbers') {
            return (
              <button key={p.id} onClick={() => setCurrentIdx(i)}
                className={cn('h-8 w-8 flex-shrink-0 rounded border text-xs', isActive ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-accent')}>
                {i + 1}
              </button>
            );
          }
          return (
            <button key={p.id} onClick={() => setCurrentIdx(i)}
              style={{ width: story.captionWidth || 170, minHeight: story.captionHeight || 44 }}
              className={cn('flex-shrink-0 overflow-hidden rounded border px-2 py-1 text-left text-[11px] leading-tight',
                isActive ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-accent')}>
              {p.caption || `Ponto ${i + 1}`}
            </button>
          );
        })}
      </div>
      {story.showArrows !== false && (
        <Button size="icon" variant="outline" className="h-8 w-8 flex-shrink-0" onClick={() => go(1)} disabled={idx >= points.length - 1}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  const sheetOptions = useMemo(() => sheets.map((s) => ({ id: s.id, name: s.name })), [sheets]);

  return (
    <div ref={shellRef} className={cn(presenting && 'fixed inset-0 z-50 overflow-auto bg-background p-6')}>
      {presenting ? (
        /* ---- Modo apresentação (RF-59 a RF-61) ---- */
        <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: dims.w }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Ponto {idx + 1} de {points.length} — use ←/→ ou as setas; Esc encerra
            </span>
            <Button size="sm" variant="outline" onClick={stopPresenting}>
              <X className="w-4 h-4 mr-1" /> Encerrar apresentação
            </Button>
          </div>
          {stage(point, Math.max(320, dims.h - 260), true)}
          {navigator}
        </div>
      ) : (
        <div className="flex gap-4 p-4">
          {/* Editor da história */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {/* RF-41 */}
              <Input value={story.name} onChange={(e) => onChange({ name: e.target.value })}
                className="h-8 border-0 px-0 text-base font-heading font-semibold shadow-none focus-visible:ring-0" />
              <Button size="sm" variant="outline" onClick={startPresenting} disabled={!points.length}>
                <Play className="w-4 h-4 mr-1" /> Apresentar
              </Button>
            </div>

            <p className="rounded border border-border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
              Atenção: intervalos de cores dinâmicos não são atualizados dentro de histórias — os pontos usam o último
              valor aplicado aos parâmetros. Para interagir com as marcas, abra a planilha ou o painel de origem.
            </p>

            {navigator}

            <div className="rounded border border-border" style={{ maxWidth: dims.w }}>
              {stage(point, 300)}
            </div>

            {/* Ações do ponto */}
            {point && draft && (
              <Card className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input value={draft.name ?? ''} placeholder="Nome do ponto"
                    onChange={(e) => patchDraft({ name: e.target.value })} className="h-8 w-48 text-xs" />
                  <Button size="sm" onClick={updatePoint} disabled={!dirty}>
                    <Save className="w-4 h-4 mr-1" /> Atualizar ponto
                  </Button>
                  <Button size="sm" variant="outline" onClick={saveAsNew}>
                    <FilePlus2 className="w-4 h-4 mr-1" /> Salvar como novo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicatePoint(point)}>
                    <Copy className="w-4 h-4 mr-1" /> Duplicar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deletePoint(point)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                  {dirty && <span className="text-[11px] text-amber-600">Alterações não salvas neste ponto</span>}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Legenda / resumo</Label>
                    <Input value={draft.caption} onChange={(e) => patchDraft({ caption: e.target.value })} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Conteúdo</Label>
                    <select className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                      value={draft.kind === 'dashboard' ? `d:${draft.dashboardId}` : draft.kind === 'blank' || !draft.sheetId ? 'blank' : `s:${draft.sheetId}`}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === 'blank') patchDraft({ kind: 'blank', sheetId: '', dashboardId: undefined });
                        else if (v.startsWith('s:')) patchDraft({ kind: 'sheet', sheetId: v.slice(2), dashboardId: undefined });
                        else patchDraft({ kind: 'dashboard', dashboardId: v.slice(2), sheetId: '' });
                      }}>
                      <option value="blank">Em branco (somente texto)</option>
                      {sheetOptions.map((s) => <option key={s.id} value={`s:${s.id}`}>Planilha — {s.name}</option>)}
                      {dashboards.map((d) => <option key={d.id} value={`d:${d.id}`}>Painel — {d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Comentário</Label>
                  <Textarea value={draft.comment ?? ''} rows={2} className="text-xs"
                    onChange={(e) => patchDraft({ comment: e.target.value })} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Classificação</Label>
                    <select value={draft.sort || 'default'} className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                      onChange={(e) => patchDraft({ sort: e.target.value as SortMode })}>
                      {(Object.keys(SORT_LABEL) as SortMode[]).map((k) => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
                    </select>
                  </div>
                  {draft.kind === 'dashboard' && (
                    <label className="flex items-end gap-2 pb-1 text-[11px]">
                      <Checkbox checked={!!draft.fitStorySize}
                        onCheckedChange={(v) => patchDraft({ fitStorySize: !!v })} />
                      Ajustar painel ao tamanho da história
                    </label>
                  )}
                </div>

                {/* RF-47: filtros do ponto */}
                <div className="space-y-1">
                  <Label className="text-[11px]">Filtros do ponto</Label>
                  <div className="flex flex-wrap gap-2">
                    <select className="h-8 rounded border border-border bg-background px-2 text-xs" value=""
                      onChange={(e) => {
                        const k = e.target.value; if (!k) return;
                        if ((draft.filters || []).some((f) => f.key === k)) return;
                        patchDraft({ filters: [...(draft.filters || []), { key: k, values: [] }] });
                      }}>
                      <option value="">+ Adicionar filtro…</option>
                      {fieldKeys.map((k) => <option key={k} value={k}>{fieldLabel(k)}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {(draft.filters || []).map((f) => (
                      <div key={f.key} className="rounded border border-border p-1.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium">{fieldLabel(f.key)}</span>
                          <button className="text-muted-foreground hover:text-destructive"
                            onClick={() => patchDraft({ filters: (draft.filters || []).filter((x) => x.key !== f.key) })}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <ScrollArea className="h-28">
                          <div className="space-y-1 pr-2">
                            {distinct(f.key).slice(0, 60).map((v) => (
                              <label key={v} className="flex items-start gap-1.5 text-[11px]">
                                <Checkbox className="mt-0.5" checked={f.values.includes(v)}
                                  onCheckedChange={(c) => patchDraft({
                                    filters: (draft.filters || []).map((x) => x.key === f.key ? {
                                      ...x, values: c ? [...x.values, v] : x.values.filter((y) => y !== v),
                                    } : x),
                                  })} />
                                <span className="line-clamp-2">{v}</span>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Painel direito: conteúdo + tamanho + navegação + formatação */}
          <div className="w-64 flex-shrink-0 space-y-3">
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">Pontos da história</p>
              <Button size="sm" variant="outline" className="h-7 w-full text-[11px]" onClick={() => addPoint('')}>
                <Plus className="w-3 h-3 mr-1" /> Ponto em branco
              </Button>
              {/* RF-42: seleção ou arraste */}
              <div className="rounded border border-dashed border-border p-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const sid = e.dataTransfer.getData('text/story-sheet');
                  const did = e.dataTransfer.getData('text/story-dashboard');
                  if (sid) addPoint(sid); else if (did) addDashboardPoint(did);
                }}>
                <p className="mb-1.5 text-[10px] text-muted-foreground">Arraste ou clique para adicionar um ponto</p>
                <div className="space-y-1">
                  {sheets.map((s) => (
                    <button key={s.id} draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/story-sheet', s.id)}
                      onClick={() => addPoint(s.id)}
                      className="flex w-full items-center gap-1.5 rounded border border-border px-1.5 py-1 text-left text-[11px] hover:bg-accent">
                      <FileSpreadsheet className="w-3 h-3" /> <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                  {dashboards.map((d) => (
                    <button key={d.id} draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/story-dashboard', d.id)}
                      onClick={() => addDashboardPoint(d.id)}
                      className="flex w-full items-center gap-1.5 rounded border border-border px-1.5 py-1 text-left text-[11px] hover:bg-accent">
                      <Presentation className="w-3 h-3" /> <span className="truncate">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* RF-40 */}
            <Card className="p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold"><Maximize2 className="w-3.5 h-3.5" /> Tamanho</p>
              <select value={story.sizePreset || 'wide'} className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                onChange={(e) => onChange({ sizePreset: e.target.value })}>
                {SIZE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              {story.sizePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">Largura (px)</Label>
                    <Input type="number" className="h-7 text-[11px]" value={story.width || 1200}
                      onChange={(e) => onChange({ width: Number(e.target.value) || 1200 })} /></div>
                  <div><Label className="text-[10px]">Altura (px)</Label>
                    <Input type="number" className="h-7 text-[11px]" value={story.height || 800}
                      onChange={(e) => onChange({ height: Number(e.target.value) || 800 })} /></div>
                </div>
              )}
            </Card>

            {/* RF-53 a RF-55 */}
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">Navegação</p>
              <select value={story.nav || 'caption'} className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                onChange={(e) => onChange({ nav: e.target.value as Story['nav'] })}>
                <option value="caption">Caixas de legenda</option>
                <option value="numbers">Números</option>
                <option value="dots">Pontos</option>
              </select>
              <label className="flex items-center gap-2 text-[11px]">
                <Checkbox checked={story.showArrows !== false}
                  onCheckedChange={(v) => onChange({ showArrows: !!v })} />
                Exibir setas anterior/próximo
              </label>
              {(story.nav || 'caption') === 'caption' && (
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">Largura legenda</Label>
                    <Input type="number" className="h-7 text-[11px]" value={story.captionWidth || 170}
                      onChange={(e) => onChange({ captionWidth: Number(e.target.value) || 170 })} /></div>
                  <div><Label className="text-[10px]">Altura legenda</Label>
                    <Input type="number" className="h-7 text-[11px]" value={story.captionHeight || 44}
                      onChange={(e) => onChange({ captionHeight: Number(e.target.value) || 44 })} /></div>
                </div>
              )}
            </Card>

            {/* RF-57 / RF-58 */}
            <Card className="p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold"><TypeIcon className="w-3.5 h-3.5" /> Formatação</p>
              <div className="space-y-1">
                <Label className="text-[10px]">Sombreamento</Label>
                <div className="flex flex-wrap gap-1">
                  {['transparent', 'hsl(var(--muted))', 'hsl(var(--accent))', 'hsl(var(--primary)/0.08)', 'hsl(var(--card))'].map((c) => (
                    <button key={c} title={c} onClick={() => onChange({ format: { ...format, shading: c } })}
                      className={cn('h-5 w-5 rounded-sm border', format.shading === c ? 'border-foreground' : 'border-border')}
                      style={{ background: c }} />
                  ))}
                  <button className="text-[10px] underline text-muted-foreground"
                    onClick={() => onChange({ format: { ...format, shading: defaultFormat().shading } })}>limpar</button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[11px]">
                <Checkbox checked={format.titleShow} onCheckedChange={(v) => onChange({ format: { ...format, titleShow: !!v } })} />
                Exibir título
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px]">Título (px)</Label>
                  <Input type="number" className="h-7 text-[11px]" value={format.titleSize}
                    onChange={(e) => onChange({ format: { ...format, titleSize: Number(e.target.value) || 18 } })} /></div>
                <div><Label className="text-[10px]">Texto (px)</Label>
                  <Input type="number" className="h-7 text-[11px]" value={format.textSize}
                    onChange={(e) => onChange({ format: { ...format, textSize: Number(e.target.value) || 13 } })} /></div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Alinhamento</Label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button key={a} onClick={() => onChange({ format: { ...format, align: a } })}
                      className={cn('flex-1 rounded border px-1 py-1 text-[10px]',
                        format.align === a ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent')}>
                      {a === 'left' ? 'Esq.' : a === 'center' ? 'Centro' : 'Dir.'}
                    </button>
                  ))}
                  <button className="text-[10px] underline text-muted-foreground"
                    onClick={() => onChange({ format: { ...format, align: defaultFormat().align } })}>limpar</button>
                </div>
              </div>
              {/* RF-58 */}
              <Button size="sm" variant="outline" className="h-7 w-full text-[11px]"
                onClick={() => onChange({ format: defaultFormat() })}>
                <RotateCcw className="w-3 h-3 mr-1" /> Restaurar padrão
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const Empty = ({ text }: { text: string }) => (
  <div className="flex h-40 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
    {text}
  </div>
);

export default StoryBoard;
