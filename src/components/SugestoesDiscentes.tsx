import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';

type Sug = { id: string; nome_curso: string; nivel: string; dimensao: string; area: string; texto_questao: string; sugestao: string };
const TODOS = '__todos__';

export function SugestoesDiscentes() {
  const [rows, setRows] = useState<Sug[]>([]);
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState(TODOS);
  const [dimensao, setDimensao] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [limite, setLimite] = useState(30);

  useEffect(() => {
    supabase.from('sugestoes').select('id,nome_curso,nivel,dimensao,area,texto_questao,sugestao,ambientes_avaliacao!inner(semestres_letivos!inner(nome))')
      .eq('perfil', 'aluno').ilike('ambientes_avaliacao.semestres_letivos.nome', '%2026%').limit(5000)
      .then(({ data }) => { setRows((data ?? []) as unknown as Sug[]); setLoading(false); });
  }, []);

  const opts = (vals: string[]) => [{ value: TODOS, label: 'Todos' }, ...[...new Set(vals.filter(Boolean))].sort().map(v => ({ value: v, label: v }))];
  const porCurso = rows.filter(r => curso === TODOS || r.nome_curso === curso);
  const porDim = porCurso.filter(r => dimensao === TODOS || r.dimensao === dimensao);
  const visiveis = useMemo(() => porDim.filter(r => area === TODOS || r.area === area), [porDim, area]);

  return <section className="space-y-4 border-t pt-6">
    <h3 className="text-xl font-bold">Sugestões dos discentes – 2026</h3>
    <div className="grid gap-3 sm:grid-cols-3">
      <SearchableSelect value={curso} onValueChange={v => { setCurso(v); setDimensao(TODOS); setArea(TODOS); }} options={opts(rows.map(r => r.nome_curso))} placeholder="Curso" />
      <SearchableSelect value={dimensao} onValueChange={v => { setDimensao(v); setArea(TODOS); }} options={opts(porCurso.map(r => r.dimensao))} placeholder="Dimensão" />
      <SearchableSelect value={area} onValueChange={setArea} options={opts(porDim.map(r => r.area))} placeholder="Área" />
    </div>
    {loading ? <p className="text-sm text-muted-foreground">Carregando sugestões…</p>
      : visiveis.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sugestão importada para este recorte.</p>
      : <>
        <p className="text-sm text-muted-foreground">{visiveis.length} sugestões</p>
        <ul className="space-y-3">{visiveis.slice(0, limite).map(s => <li key={s.id} className="rounded-md border border-l-4 border-l-primary p-4">
          <p className="leading-6">“{s.sugestao}”</p>
          <p className="mt-2 text-xs text-muted-foreground">{[s.nome_curso, s.nivel, s.dimensao, s.area].filter(Boolean).join(' · ')}{s.texto_questao && ` — ${s.texto_questao}`}</p>
        </li>)}</ul>
        {visiveis.length > limite && <Button variant="outline" onClick={() => setLimite(l => l + 30)}>Mostrar mais</Button>}
      </>}
  </section>;
}
