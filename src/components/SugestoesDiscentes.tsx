import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { classificarSentimento, resumoSentimentos, type Sentimento } from '@/lib/sentimento';

const ROT: Record<Sentimento, string> = { positivo: 'Positivo', negativo: 'Negativo', neutro: 'Neutro' };
const COR: Record<Sentimento, string> = { positivo: 'border-success/40 text-success', negativo: 'border-destructive/40 text-destructive', neutro: 'border-border text-muted-foreground' };

type Sug = { id: string; nome_curso: string; nivel: string; dimensao: string; area: string; texto_questao: string; sugestao: string };
const TODOS = '__todos__';

export function SugestoesDiscentes({ perfil = 'aluno' }: { perfil?: 'aluno' | 'professor' | 'colaborador' }) {
  const [rows, setRows] = useState<Sug[]>([]);
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState(TODOS);
  const [dimensao, setDimensao] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [limite, setLimite] = useState(30);
  const [sent, setSent] = useState<Sentimento | null>(null);

  useEffect(() => {
    supabase.from('sugestoes').select('id,nome_curso,nivel,dimensao,area,texto_questao,sugestao,ambientes_avaliacao!inner(semestres_letivos!inner(nome))')
      .eq('perfil', perfil).ilike('ambientes_avaliacao.semestres_letivos.nome', '%2026%').limit(5000)
      .then(({ data }) => { const vistos = new Set<string>(); setRows(((data ?? []) as unknown as Sug[]).filter(r => { const k = [r.nome_curso, r.nivel, r.dimensao, r.area, r.texto_questao, r.sugestao.trim()].join('|'); if (vistos.has(k)) return false; vistos.add(k); return true; })); setLoading(false); });
  }, [perfil]);

  const opts = (vals: string[]) => [{ value: TODOS, label: 'Todos' }, ...[...new Set(vals.filter(Boolean))].sort().map(v => ({ value: v, label: v }))];
  const porCurso = rows.filter(r => curso === TODOS || r.nome_curso === curso);
  const porDim = porCurso.filter(r => dimensao === TODOS || r.dimensao === dimensao);
  const recorte = useMemo(() => porDim.filter(r => area === TODOS || r.area === area), [porDim, area]);
  const resumo = useMemo(() => resumoSentimentos(recorte.map(r => r.sugestao)), [recorte]);
  const visiveis = useMemo(() => sent ? recorte.filter(r => classificarSentimento(r.sugestao) === sent) : recorte, [recorte, sent]);

  return <section className="space-y-4 border-t pt-6">
    <h3 className="text-xl font-bold">Sugestões dos {perfil === 'professor' ? 'docentes' : perfil === 'colaborador' ? 'colaboradores' : 'discentes'} – 2026</h3>
    <div className="grid gap-3 sm:grid-cols-3">
      <SearchableSelect value={curso} onValueChange={v => { setCurso(v); setDimensao(TODOS); setArea(TODOS); }} options={opts(rows.map(r => r.nome_curso))} placeholder="Curso" />
      <SearchableSelect value={dimensao} onValueChange={v => { setDimensao(v); setArea(TODOS); }} options={opts(porCurso.map(r => r.dimensao))} placeholder="Dimensão" />
      <SearchableSelect value={area} onValueChange={setArea} options={opts(porDim.map(r => r.area))} placeholder="Área" />
    </div>
    {loading ? <p className="text-sm text-muted-foreground">Carregando sugestões…</p>
      : recorte.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sugestão importada para este recorte.</p>
      : <>
        <div className="space-y-2 rounded-md border p-4">
          <p className="font-semibold">Análise de sentimentos</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">{(['positivo', 'neutro', 'negativo'] as Sentimento[]).map(k => <div key={k} style={{ width: `${resumo[k] / recorte.length * 100}%` }} className={k === 'positivo' ? 'bg-success' : k === 'negativo' ? 'bg-destructive' : 'bg-muted-foreground/40'} />)}</div>
          <div className="flex flex-wrap gap-2">{(['positivo', 'neutro', 'negativo'] as Sentimento[]).map(k => <Button key={k} size="sm" variant={sent === k ? 'secondary' : 'outline'} onClick={() => setSent(sent === k ? null : k)}>{ROT[k]}: {resumo[k]} ({Math.round(resumo[k] / recorte.length * 100)}%)</Button>)}</div>
          <p className="text-xs text-muted-foreground">Classificação automática pelas palavras usadas; clique para filtrar.</p>
        </div>
        <p className="text-sm text-muted-foreground">{visiveis.length} sugestões</p>
        <ul className="space-y-3">{visiveis.slice(0, limite).map(s => <li key={s.id} className="rounded-md border border-l-4 border-l-primary p-4">
          <div className="flex items-start justify-between gap-3"><p className="leading-6">“{s.sugestao}”</p>{(() => { const k = classificarSentimento(s.sugestao); return <Badge variant="outline" className={COR[k]}>{ROT[k]}</Badge>; })()}</div>
          <p className="mt-2 text-xs text-muted-foreground">{[s.nome_curso, s.nivel, s.dimensao, s.area].filter(Boolean).join(' · ')}{s.texto_questao && ` — ${s.texto_questao}`}</p>
        </li>)}</ul>
        {visiveis.length > limite && <Button variant="outline" onClick={() => setLimite(l => l + 30)}>Mostrar mais</Button>}
      </>}
  </section>;
}
