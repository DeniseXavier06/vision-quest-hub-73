import { useEffect, useState } from 'react';
import { Settings2, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SerieCfg = { key: string; nome: string; cor: string };
export type ChartCfg = {
  titulo: string; rotulos: boolean; legenda: boolean;
  legendaPos: 'top' | 'bottom' | 'right'; series: Record<string, { nome: string; cor: string }>;
};

const PREFIX = 'chart-custom:';

/** Converts CSS color (incl. hsl(var(--x))) to #hex so it can be used in <input type=color>. */
function toHex(cor: string): string {
  if (/^#[0-9a-f]{6}$/i.test(cor)) return cor;
  if (typeof document === 'undefined') return '#000000';
  const el = document.createElement('div'); el.style.color = cor; document.body.appendChild(el);
  const rgb = getComputedStyle(el).color; el.remove();
  const m = rgb.match(/\d+(\.\d+)?/g);
  if (!m) return '#000000';
  return '#' + m.slice(0, 3).map(n => Math.round(Number(n)).toString(16).padStart(2, '0')).join('');
}

export function useChartCustom(id: string, defaults: { titulo?: string; series: SerieCfg[]; legenda?: boolean; rotulos?: boolean }) {
  const [saved, setSaved] = useState<Partial<ChartCfg>>(() => {
    try { return JSON.parse(localStorage.getItem(PREFIX + id) || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem(PREFIX + id, JSON.stringify(saved)); }, [id, saved]);
  const series: ChartCfg['series'] = {};
  defaults.series.forEach(s => { series[s.key] = { nome: saved.series?.[s.key]?.nome || s.nome, cor: saved.series?.[s.key]?.cor || s.cor }; });
  const cfg: ChartCfg = {
    titulo: saved.titulo ?? defaults.titulo ?? '',
    rotulos: saved.rotulos ?? defaults.rotulos ?? true,
    legenda: saved.legenda ?? defaults.legenda ?? true,
    legendaPos: saved.legendaPos ?? 'bottom',
    series,
  };
  const update = (p: Partial<ChartCfg>) => setSaved(s => ({ ...s, ...p }));
  const updateSerie = (key: string, p: Partial<{ nome: string; cor: string }>) =>
    setSaved(s => ({ ...s, series: { ...(s.series || {}), [key]: { ...(s.series?.[key] || series[key]), ...p } } }));
  const reset = () => setSaved({});
  return { cfg, update, updateSerie, reset, defaults: defaults.series };
}

export function ChartCustomizer({ ctl }: { ctl: ReturnType<typeof useChartCustom> }) {
  const { cfg, update, updateSerie, reset, defaults } = ctl;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1"><Settings2 className="h-4 w-4" />Personalizar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto space-y-3" align="end">
        <div className="space-y-1"><Label>Título</Label><Input value={cfg.titulo} onChange={e => update({ titulo: e.target.value })} /></div>
        <div className="flex items-center justify-between"><Label>Rótulos de dados</Label><Switch checked={cfg.rotulos} onCheckedChange={v => update({ rotulos: v })} /></div>
        <div className="flex items-center justify-between"><Label>Legenda</Label><Switch checked={cfg.legenda} onCheckedChange={v => update({ legenda: v })} /></div>
        {cfg.legenda && <div className="space-y-1"><Label>Posição da legenda</Label>
          <Select value={cfg.legendaPos} onValueChange={v => update({ legendaPos: v as ChartCfg['legendaPos'] })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="top">Topo</SelectItem><SelectItem value="bottom">Rodapé</SelectItem><SelectItem value="right">Direita</SelectItem></SelectContent>
          </Select></div>}
        <div className="space-y-2"><Label>Séries: nome e cor</Label>
          {defaults.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <input type="color" aria-label={`Cor de ${s.key}`} className="h-8 w-10 cursor-pointer rounded border border-input bg-background" value={toHex(cfg.series[s.key].cor)} onChange={e => updateSerie(s.key, { cor: e.target.value })} />
              <Input className="h-8" value={cfg.series[s.key].nome} onChange={e => updateSerie(s.key, { nome: e.target.value })} />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full gap-1" onClick={reset}><RotateCcw className="h-4 w-4" />Restaurar padrão</Button>
      </PopoverContent>
    </Popover>
  );
}

export const legendProps = (cfg: ChartCfg) => cfg.legendaPos === 'right'
  ? { layout: 'vertical' as const, verticalAlign: 'middle' as const, align: 'right' as const }
  : { verticalAlign: cfg.legendaPos === 'top' ? 'top' as const : 'bottom' as const };
