import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ChevronLeft, ChevronRight, GraduationCap, Loader2, Presentation, Download, X } from 'lucide-react';
import { Legend, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { conceito, mediaHierarquica, percFavoravel, totalRespostas } from '@/lib/medidas';
import { areasParaAcao, resumirGrupos, selecionarDiscentes, compararAnos, comEixo, recorteCurso, ANOS_TRIENIO, CONCEITOS_PRIORITARIOS, type ResultadoDiscente } from '@/lib/storytelling-discentes';
import { cn } from '@/lib/utils';

const TODOS = '__todos__';
const titulos = ['O que os discentes revelam?', 'Médias por curso', 'Médias por dimensão', 'Médias por eixo', 'Médias por professor', 'Médias por área', 'Prioridades para os planos de ação', 'Da escuta à ação'];
const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const classesConceito: Record<string, string> = {
  Excelente: 'text-success border-success/40', Bom: 'text-info border-info/40',
  'Atende Parcialmente': 'text-warning border-warning/40', Regular: 'text-destructive border-destructive/40',
  'Muito Ruim': 'text-destructive border-destructive/40',
};
const ConceitoBadge = ({ valor }: { valor: string }) => <Badge variant="outline" className={cn('whitespace-nowrap', classesConceito[valor])}>{valor}</Badge>;

function GraficoMedias({ dados, cores, onClickBar }: { dados: ReturnType<typeof resumirGrupos>; cores: Record<string, string>; onClickBar?: (nome: string) => void }) {
  if (!dados.length) return <p className="py-12 text-center text-muted-foreground">Sem resultados disponíveis para este recorte.</p>;
  return <div className="space-y-4">
    <ResponsiveContainer width="100%" height={Math.max(300, dados.length * 48)}>
      <BarChart data={dados} layout="vertical" margin={{ left: 0, right: 50, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
        <YAxis dataKey="nome" type="category" width={155} tick={{ fontSize: 11 }} tickFormatter={(s: string) => s.length > 24 ? s.slice(0, 23) + '…' : s} />
        <Tooltip formatter={(valor: number) => [fmt(valor), 'Média']} />
        <Bar dataKey="media" name="Média" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false} style={onClickBar ? { cursor: 'pointer' } : undefined} onClick={onClickBar ? (d: { nome?: string }) => d?.nome && onClickBar(d.nome) : undefined}>
          {dados.map(d => <Cell key={d.nome} fill={cores[d.conceito]} />)}
          <LabelList dataKey="media" position="right" formatter={fmt} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    <Table><TableHeader><TableRow><TableHead>Indicador</TableHead><TableHead className="text-right">Média</TableHead><TableHead>Conceito</TableHead></TableRow></TableHeader>
      <TableBody>{dados.map(d => <TableRow key={d.nome}><TableCell className="font-medium">{onClickBar ? <Button variant="ghost" className="h-auto whitespace-normal text-left" onClick={() => onClickBar(String(d.nome))}>{d.nome}<ChevronRight className="ml-2 h-4 w-4 shrink-0" /></Button> : d.nome}</TableCell><TableCell className="text-right">{fmt(d.media)}</TableCell><TableCell><ConceitoBadge valor={d.conceito} /></TableCell></TableRow>)}</TableBody>
    </Table>
  </div>;
}

function GraficoComparativo({ dados, anos, cores, onClickBar }: { dados: ReturnType<typeof compararAnos>; anos: string[]; cores: string[]; onClickBar?: (nome: string) => void }) {
  if (!dados.length) return <p className="py-12 text-center text-muted-foreground">Sem resultados disponíveis para este recorte.</p>;
  const f = (v: number | null) => v == null ? '—' : fmt(v);
  return <div className="space-y-4">
    <ResponsiveContainer width="100%" height={Math.max(320, dados.length * 70)}>
      <BarChart data={dados} layout="vertical" margin={{ left: 0, right: 50, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
        <YAxis dataKey="nome" type="category" width={155} tick={{ fontSize: 11 }} tickFormatter={(s: string) => s.length > 24 ? s.slice(0, 23) + '…' : s} />
        <Tooltip formatter={(v: number) => fmt(v)} /><Legend />
        {anos.map((a, i) => <Bar key={a} dataKey={a} name={a} fill={cores[i]} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} style={onClickBar ? { cursor: 'pointer' } : undefined} onClick={onClickBar ? (d: { nome?: string }) => d?.nome && onClickBar(d.nome) : undefined}><LabelList dataKey={a} position="right" formatter={fmt} fontSize={10} /></Bar>)}
      </BarChart>
    </ResponsiveContainer>
    <Table><TableHeader><TableRow><TableHead>Indicador</TableHead>{anos.map(a => <TableHead key={a} className="text-right">{a}</TableHead>)}<TableHead className="text-right">Variação {anos[0]}–{anos[anos.length - 1]}</TableHead></TableRow></TableHeader>
      <TableBody>{dados.map(d => { const ini = d[anos[0]] as number | null, fim = d[anos[anos.length - 1]] as number | null; return <TableRow key={d.nome as string}><TableCell className="font-medium">{onClickBar ? <Button variant="ghost" className="h-auto whitespace-normal text-left" onClick={() => onClickBar(String(d.nome))}>{d.nome}<ChevronRight className="ml-2 h-4 w-4 shrink-0" /></Button> : d.nome}</TableCell>{anos.map(a => <TableCell key={a} className="text-right">{f(d[a] as number | null)}{d[a] != null && <span className="ml-2"><ConceitoBadge valor={conceito(d[a] as number)} /></span>}</TableCell>)}<TableCell className="text-right">{ini != null && fim != null ? `${fim - ini >= 0 ? '+' : ''}${fmt(fim - ini)}` : '—'}</TableCell></TableRow>; })}</TableBody>
    </Table>
  </div>;
}

const CACHE = new Map<string, Promise<ResultadoDiscente[]>>();
const StorytellingDiscentesSection = ({ trienio = false }: { trienio?: boolean }) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);
  const [cursoDrill, setCursoDrill] = useState<{ curso: string | null; dimensao: string | null }>({ curso: null, dimensao: null });
  const anos = trienio ? ANOS_TRIENIO : ['2026'];
  const ultimo = anos[anos.length - 1];
  const [prioDimensao, setPrioDimensao] = useState(TODOS);
  const [prioArea, setPrioArea] = useState(TODOS);
  const [prioQuestao, setPrioQuestao] = useState(TODOS);
  const [coresAnos, setCoresAnos] = useState<string[]>([]);
  const [rows, setRows] = useState<ResultadoDiscente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [nivel, setNivel] = useState(TODOS);
  const [curso, setCurso] = useState(TODOS);
  const [dimensao, setDimensao] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [conceitoFiltro, setConceitoFiltro] = useState(TODOS);
  const [pagina, setPagina] = useState(0);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [apresentando, setApresentando] = useState(false);
  const [slide, setSlide] = useState(0);
  const [cores, setCores] = useState<Record<string, string>>({});
  const [drill, setDrill] = useState<{ eixo: string | null; dimensao: string | null }>({ eixo: null, dimensao: null });

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setCores(Object.fromEntries(['Excelente', 'Bom', 'Atende Parcialmente', 'Regular', 'Muito Ruim'].map((c, i) =>
      [c, `hsl(${css.getPropertyValue(['--cpa-excelente', '--cpa-bom', '--cpa-parcial', '--cpa-regular', '--cpa-muito-ruim'][i]).trim()})`])));
  }, []);
  useEffect(() => { const css = getComputedStyle(document.documentElement); setCoresAnos(['--info', '--warning', '--primary'].map(v => `hsl(${css.getPropertyValue(v).trim()})`)); }, []);

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setErro(false);
      try {
        const chave = anos.join(',');
        if (!CACHE.has(chave)) CACHE.set(chave, (async () => {
          const base = () => supabase.from('resultados')
            .select('id,semestre,nivel,curso,dimensao,area,texto_questao,excelente,bom,atende_parcialmente,regular,muito_ruim,nao_se_aplica,total,media,professor', { count: 'exact' })
            .or(anos.map(a => `semestre.like.${a}%`).join(',')).or('nivel.ilike.%aluno%,nivel.ilike.%discente%');
          const primeira = await base().order('id').range(0, 999);
          if (primeira.error) throw primeira.error;
          const total = primeira.count || 0;
          const resto = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / 1000) - 1) }, (_, i) => base().order('id').range((i + 1) * 1000, (i + 2) * 1000 - 1)));
          const erro = resto.find(r => r.error); if (erro) throw erro.error;
          return [primeira, ...resto].flatMap(r => r.data || []).map(r => ({ semestre: r.semestre, nivel: r.nivel, curso: r.curso, dimensao: r.dimensao, area: r.area,
            textoQuestao: r.texto_questao, excelente: r.excelente, bom: r.bom, atendeParcialmente: r.atende_parcialmente,
            regular: r.regular, muitoRuim: r.muito_ruim, naoSeAplica: r.nao_se_aplica, total: r.total, media: Number(r.media), professor: r.professor || '' })) as ResultadoDiscente[];
        })().catch(e => { CACHE.delete(chave); throw e; }));
        const todas = await CACHE.get(chave)!;
        if (cancelado) return;
        if (!cancelado) setRows(comEixo(selecionarDiscentes(todas, anos)));
      } catch { if (!cancelado) setErro(true); }
      finally { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [tentativa, trienio]);

  useEffect(() => {
    if (!apresentando) return;
    const navegar = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,[role="combobox"]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setSlide(s => Math.min(titulos.length - 1, s + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setSlide(s => Math.max(0, s - 1)); }
      if (e.key === 'Escape') setApresentando(false);
    };
    window.addEventListener('keydown', navegar);
    return () => window.removeEventListener('keydown', navegar);
  }, [apresentando]);

  useEffect(() => { containerRef.current?.scrollTo({ top: 0 }); }, [slide, apresentando]);
  useEffect(() => {
    if (!apresentando) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [apresentando]);

  useEffect(() => { setCursoDrill({ curso: null, dimensao: null }); setPagina(0); setDetalhe(null); setDrill({ eixo: null, dimensao: null }); }, [nivel, curso, dimensao, area, conceitoFiltro, prioDimensao, prioArea, prioQuestao]);
  const opcoes = (campo: 'nivel' | 'curso' | 'dimensao' | 'area') => [...new Set(rows.map(r => r[campo]).filter(Boolean))].sort();
  const filtrado = useMemo(() => rows.filter(r => (nivel === TODOS || r.nivel === nivel) && (curso === TODOS || r.curso === curso) &&
    (dimensao === TODOS || r.dimensao === dimensao) && (area === TODOS || r.area === area)), [rows, nivel, curso, dimensao, area]);
  const grupos = useMemo(() => ({ curso: resumirGrupos(filtrado, 'curso'), dimensao: resumirGrupos(filtrado, 'dimensao'),
    area: resumirGrupos(filtrado, 'area'), professor: resumirGrupos(filtrado, 'professor'), eixo: resumirGrupos(filtrado, 'eixo') }), [filtrado]);
  const prioridades = useMemo(() => areasParaAcao(trienio ? filtrado.filter(r => r.semestre.trim().startsWith(ultimo)) : filtrado), [filtrado, trienio, ultimo]);
  const comparativos = useMemo(() => ({ curso: compararAnos(filtrado, 'curso', anos), dimensao: compararAnos(filtrado, 'dimensao', anos),
    area: compararAnos(filtrado, 'area', anos), professor: compararAnos(filtrado, 'professor', anos), eixo: compararAnos(filtrado, 'eixo', anos) }), [filtrado, trienio]);
  const cursoCampo = cursoDrill.dimensao ? 'area' : cursoDrill.curso ? 'dimensao' : 'curso';
  const cursoRows = useMemo(() => recorteCurso(filtrado, cursoDrill.curso, cursoDrill.dimensao), [filtrado, cursoDrill]);
  const cursoDados = useMemo(() => ({ resumo: resumirGrupos(cursoRows, cursoCampo), comparativo: compararAnos(cursoRows, cursoCampo, anos) }), [cursoRows, cursoCampo, trienio]);
  const expandirCurso = (nome: string) => setCursoDrill(d => d.curso ? { ...d, dimensao: nome } : { curso: nome, dimensao: null });
  const drillNivel: 'eixo' | 'area' = drill.eixo ? 'area' : 'eixo';
  const drillRows = useMemo(() => filtrado.filter(r => (!drill.eixo || r.eixo === drill.eixo) && (!drill.dimensao || r.dimensao === drill.dimensao)), [filtrado, drill]);
  const drillDados = useMemo(() => ({ resumo: resumirGrupos(drillRows, drillNivel), comparativo: compararAnos(drillRows, drillNivel, anos) }), [drillRows, drillNivel, trienio]);
  const drillClick = (nome: string) => setDrill(d => d.eixo ? d : { eixo: nome, dimensao: null });
  const uniq = (l: string[]) => [...new Set(l.filter(Boolean))].sort();
  const prioDims = uniq(prioridades.map(p => p.dimensao));
  const prioAreas = uniq(prioridades.filter(p => prioDimensao === TODOS || p.dimensao === prioDimensao).map(p => p.area));
  const prioQuestoes = uniq(prioridades.filter(p => (prioDimensao === TODOS || p.dimensao === prioDimensao) && (prioArea === TODOS || p.area === prioArea)).flatMap(p => p.evidencias.map(e => e.questao)));
  const prioridadesVisiveis = prioridades.filter(p => (conceitoFiltro === TODOS || p.conceito === conceitoFiltro) && (prioDimensao === TODOS || p.dimensao === prioDimensao)
    && (prioArea === TODOS || p.area === prioArea) && (prioQuestao === TODOS || p.evidencias.some(e => e.questao === prioQuestao)))
    .map(p => prioQuestao === TODOS ? p : { ...p, evidencias: [...p.evidencias].sort((a, b) => Number(b.questao === prioQuestao) - Number(a.questao === prioQuestao)) });
  const selecionada = prioridadesVisiveis.find(p => JSON.stringify([p.nivel, p.curso, p.dimensao, p.area]) === detalhe);
  const media = mediaHierarquica(filtrado);
  const mostrar = (i: number) => !apresentando || slide === i;
  const limpar = () => { setNivel(TODOS); setCurso(TODOS); setDimensao(TODOS); setArea(TODOS); setConceitoFiltro(TODOS); };

  const exportar = async () => {
    setExportando(true);
    try {
      const { baixarPowerPointDiscentes } = await import('@/lib/storytelling-pptx');
      await baixarPowerPointDiscentes(filtrado, anos, [nivel, curso, dimensao, area].filter(v => v !== TODOS));
      toast({ title: 'PowerPoint gerado', description: 'Todas as informações do recorte foram incluídas, com detalhes por curso e questões prioritárias.' });
    } catch { toast({ title: 'Não foi possível gerar o PowerPoint', description: 'Tente novamente.', variant: 'destructive' }); }
    finally { setExportando(false); }
  };

  if (loading) return <div role="status" className="flex items-center justify-center gap-3 py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" />Carregando resultados discentes de 2026…</div>;
  if (erro) return <div role="alert" className="space-y-3 py-12 text-center"><p>Não foi possível carregar os resultados de 2026.</p><Button variant="outline" onClick={() => setTentativa(t => t + 1)}>Tentar novamente</Button></div>;

  const conteudo = <div ref={containerRef} role={apresentando ? 'dialog' : undefined} aria-modal={apresentando ? true : undefined} aria-label={apresentando ? 'Apresentação dos resultados discentes' : undefined} className={cn('space-y-8', apresentando && 'fixed inset-0 z-[100] overflow-y-auto bg-background px-6 pt-6 pb-28 sm:px-12 sm:pt-10')}>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-2xl font-bold"><GraduationCap className="h-6 w-6 text-primary" />Discentes / {trienio ? 'Triênio 2024–2026' : '2026'}</h2><p className="mt-1 text-sm text-muted-foreground">Resultados da autoavaliação institucional · {Array.from(new Set(rows.map(r => r.semestre))).join(', ') || '2026'} · Escala de 0 a 5</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportar} disabled={exportando || !filtrado.length}>{exportando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Gerar PowerPoint</Button><Button variant="outline" onClick={() => { setSlide(0); setApresentando(v => !v); }}>{apresentando ? <X className="mr-2 h-4 w-4" /> : <Presentation className="mr-2 h-4 w-4" />}{apresentando ? 'Sair da apresentação' : 'Apresentar'}</Button></div>
    </header>
    {!apresentando && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {(['nivel', 'curso', 'dimensao', 'area'] as const).map((campo, i) => <label key={campo} className="space-y-1 text-sm"><span className="font-medium">{['Nível', 'Curso', 'Dimensão', 'Área'][i]}</span><SearchableSelect value={[nivel, curso, dimensao, area][i]} onValueChange={[setNivel, setCurso, setDimensao, setArea][i]} options={[{ value: TODOS, label: ['Todos os níveis', 'Todos os cursos', 'Todas as dimensões', 'Todas as áreas'][i] }, ...opcoes(campo).map(v => ({ value: v, label: v }))]} /></label>)}
    </div>}
    {!apresentando && (nivel !== TODOS || curso !== TODOS || dimensao !== TODOS || area !== TODOS) && <Button variant="ghost" size="sm" onClick={limpar}>Limpar filtros</Button>}
    {!filtrado.length ? <p className="py-16 text-center text-muted-foreground">Nenhum resultado discente de 2026 encontrado para este recorte.</p> : <>
      {mostrar(0) && <section className="space-y-6">
        <h3 className="text-xl font-bold">O que os discentes revelam?</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['Média geral', fmt(media)], ['Conceito geral', conceito(media)], ['Respostas favoráveis', `${fmt(percFavoravel(filtrado))}%`], ['Respostas às questões', totalRespostas(filtrado).toLocaleString('pt-BR')]].map(([titulo, valor]) => <div key={titulo} className="border-l-4 border-primary bg-muted/40 p-4"><p className="text-sm text-muted-foreground">{titulo}</p><p className="mt-2 text-xl font-bold">{valor}</p></div>)}
        </div>
        <div className="space-y-3 text-base leading-7">
          <p>Em 2026, a experiência dos discentes alcança média <strong>{fmt(media)}</strong>, com conceito <strong>{conceito(media)}</strong>. O resultado reúne {grupos.curso.length} cursos no recorte selecionado.</p>
          {grupos.curso[0] && <p><strong>Destaque:</strong> {grupos.curso[0].nome} tem a maior média ({fmt(grupos.curso[0].media)}). {grupos.area[0]?.nome} lidera entre as áreas, com {fmt(grupos.area[0]?.media || 0)}.</p>}
          <p><strong>O ponto decisivo:</strong> {prioridades.length ? `${prioridades.length} recortes de área por curso e nível ficaram em Atende Parcialmente, Regular ou Muito Ruim. A média geral não deve ocultar esses pontos de atenção.` : 'nenhuma área por curso e nível ficou nos conceitos prioritários. O acompanhamento das questões continua importante para preservar os resultados.'}</p>
          {trienio && <p><strong>Evolução da média geral:</strong> {anos.map(a => { const g = filtrado.filter(r => r.semestre.trim().startsWith(a)); return `${a}: ${g.length ? `${fmt(mediaHierarquica(g))} (${conceito(mediaHierarquica(g))})` : 'sem dados'}`; }).join(' · ')}.</p>}
          <p className="text-sm text-muted-foreground">Médias calculadas pelas medidas CPA compartilhadas: média das linhas das questões por área, seguida da média das áreas. Respostas não representam pessoas únicas; dados de participação não entram nestas médias.</p>
        </div>
      </section>}
      {([['curso', 1, 'Médias por curso'], ['dimensao', 2, 'Médias por dimensão'], ['eixo', 3, 'Médias por eixo'], ['professor', 4, 'Médias por professor'], ['area', 5, 'Médias por área']] as const).map(([campo, indice, titulo]) => mostrar(indice) && <section key={campo} className="space-y-4 border-t pt-6"><h3 className="text-xl font-bold">{titulo}</h3>{campo === 'curso' ? <div className={cn('space-y-4', cursoDrill.curso && 'border-l-4 border-primary bg-muted/30 p-4 sm:p-6')}>
        <nav aria-label="Expansão das médias do curso" className="flex flex-wrap items-center gap-2">
          <Button variant={cursoDrill.curso ? 'outline' : 'secondary'} size="sm" onClick={() => setCursoDrill({ curso: null, dimensao: null })}>Cursos</Button>
          {cursoDrill.curso && <><ChevronRight className="h-4 w-4" /><Button variant={cursoDrill.dimensao ? 'outline' : 'secondary'} size="sm" className="h-auto whitespace-normal text-left" onClick={() => setCursoDrill(d => ({ ...d, dimensao: null }))}>{cursoDrill.curso}</Button></>}
          {cursoDrill.dimensao && <><ChevronRight className="h-4 w-4" /><Badge variant="secondary" className="whitespace-normal">{cursoDrill.dimensao}</Badge></>}
        </nav>
        <h4 className="text-xl font-bold text-primary">{cursoDrill.dimensao ? `Áreas · ${cursoDrill.dimensao}` : cursoDrill.curso ? `Dimensões · ${cursoDrill.curso}` : 'Cursos'}</h4>
        {trienio ? <GraficoComparativo dados={cursoDados.comparativo} anos={anos} cores={coresAnos} onClickBar={cursoDrill.dimensao ? undefined : expandirCurso} /> : <GraficoMedias dados={cursoDados.resumo} cores={cores} onClickBar={cursoDrill.dimensao ? undefined : expandirCurso} />}
      </div> : campo === 'eixo' ? <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button variant={drill.eixo ? 'ghost' : 'secondary'} size="sm" onClick={() => setDrill({ eixo: null, dimensao: null })}>Todos os eixos</Button>
          {drill.eixo && <><ChevronRight className="h-4 w-4 text-muted-foreground" /><Button variant="secondary" size="sm" onClick={() => setDrill(d => ({ ...d, dimensao: null }))}>{drill.eixo}</Button></>}
          
        </div>
        <p className="text-sm text-muted-foreground">{drill.eixo ? 'Áreas do eixo selecionado. Use o caminho acima para voltar.' : 'Clique em um eixo para ver as áreas.'}</p>
        {trienio ? <GraficoComparativo dados={drillDados.comparativo} anos={anos} cores={coresAnos} onClickBar={drill.eixo ? undefined : drillClick} /> : <GraficoMedias dados={drillDados.resumo} cores={cores} onClickBar={drill.eixo ? undefined : drillClick} />}
      </div> : campo === 'professor' && !grupos.professor.length ? <p className="bg-muted/40 p-5 text-muted-foreground">Os resultados de 2026 não identificam os professores individualmente. A percepção sobre o ensino está disponível na dimensão “Avaliando o Professor”; não há média individual por professor neste conjunto de dados.</p> : (trienio ? <GraficoComparativo dados={comparativos[campo]} anos={anos} cores={coresAnos} /> : <GraficoMedias dados={grupos[campo]} cores={cores} />)}</section>)}
      {mostrar(6) && <section className="space-y-5 border-t pt-6">
        <h3 className="flex items-center gap-2 text-xl font-bold"><AlertTriangle className="h-5 w-5 text-warning" />Prioridades para os planos de ação</h3>
        <p className="text-muted-foreground">{trienio && `Prioridades com base em ${ultimo}. `}Áreas analisadas separadamente por curso, nível e dimensão, da menor para a maior média.</p>
        <div className="flex flex-wrap gap-3">{CONCEITOS_PRIORITARIOS.map(c => <div key={c} className="flex items-center gap-2 border-b-2 border-border py-2"><ConceitoBadge valor={c} /><strong>{prioridades.filter(p => p.conceito === c).length}</strong></div>)}</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm"><span>Dimensão</span><SearchableSelect value={prioDimensao} onValueChange={v => { setPrioDimensao(v); setPrioArea(TODOS); setPrioQuestao(TODOS); }} options={[{ value: TODOS, label: 'Todas as dimensões' }, ...prioDims.map(v => ({ value: v, label: v }))]} /></label>
          <label className="space-y-1 text-sm"><span>Área</span><SearchableSelect value={prioArea} onValueChange={v => { setPrioArea(v); setPrioQuestao(TODOS); }} options={[{ value: TODOS, label: 'Todas as áreas' }, ...prioAreas.map(v => ({ value: v, label: v }))]} /></label>
          <label className="space-y-1 text-sm"><span>Questão</span><SearchableSelect value={prioQuestao} onValueChange={setPrioQuestao} options={[{ value: TODOS, label: 'Todas as questões' }, ...prioQuestoes.map(v => ({ value: v, label: v }))]} /></label>
        <label className="space-y-1 text-sm"><span>Conceito prioritário</span><SearchableSelect value={conceitoFiltro} onValueChange={setConceitoFiltro} options={[{ value: TODOS, label: 'Todos os conceitos prioritários' }, ...CONCEITOS_PRIORITARIOS.map(c => ({ value: c, label: c }))]} /></label></div>
        {!prioridadesVisiveis.length ? <p className="py-8 text-muted-foreground">Nenhuma área neste conceito para os filtros selecionados.</p> : <>
          <Table><TableHeader><TableRow><TableHead>Curso / Nível</TableHead><TableHead>Dimensão / Área</TableHead><TableHead>Média</TableHead><TableHead>Conceito</TableHead><TableHead>Questão com menor média</TableHead><TableHead /></TableRow></TableHeader><TableBody>
            {prioridadesVisiveis.slice(pagina * 12, pagina * 12 + 12).map(p => {
              const chave = JSON.stringify([p.nivel, p.curso, p.dimensao, p.area]);
              return <TableRow key={chave}><TableCell className="min-w-40"><strong>{p.curso}</strong><p className="text-xs text-muted-foreground">{p.nivel}</p></TableCell><TableCell className="min-w-40">{p.area}<p className="text-xs text-muted-foreground">{p.dimensao}</p></TableCell><TableCell>{fmt(p.media)}</TableCell><TableCell><ConceitoBadge valor={p.conceito} /></TableCell><TableCell className="min-w-64">{p.evidencias[0]?.questao}<p className="font-medium">{fmt(p.evidencias[0]?.media || 0)}</p></TableCell><TableCell><Button variant="outline" size="sm" onClick={() => setDetalhe(chave)}>Ver questões</Button></TableCell></TableRow>;
            })}
          </TableBody></Table>
          <div className="flex items-center justify-end gap-3"><Button variant="outline" size="icon" aria-label="Página anterior de prioridades" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm">{pagina + 1} / {Math.ceil(prioridadesVisiveis.length / 12)}</span><Button variant="outline" size="icon" aria-label="Próxima página de prioridades" disabled={(pagina + 1) * 12 >= prioridadesVisiveis.length} onClick={() => setPagina(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
        </>}
        {selecionada && <div className="space-y-4 border-t pt-5"><h4 className="text-lg font-bold">{selecionada.curso} · {selecionada.area}</h4><p className="text-sm text-muted-foreground">{selecionada.nivel} · {selecionada.dimensao} · Média {fmt(selecionada.media)}</p><Table><TableHeader><TableRow><TableHead>Questão</TableHead><TableHead>Média</TableHead><TableHead>Conceito</TableHead></TableRow></TableHeader><TableBody>{selecionada.evidencias.map(q => <TableRow key={q.questao}><TableCell>{q.questao}</TableCell><TableCell>{fmt(q.media)}</TableCell><TableCell><ConceitoBadge valor={conceito(q.media)} /></TableCell></TableRow>)}</TableBody></Table><p className="leading-6"><strong>Ação proposta para validação da coordenação:</strong> investigar as causas do resultado em “{selecionada.evidencias[0]?.questao}”, ouvir alunos e responsáveis pela área, definir uma melhoria verificável e acompanhar a média na próxima avaliação. Responsável, prazo e meta devem ser pactuados no plano de ação.</p></div>}
      </section>}
      {mostrar(7) && <section className="space-y-4 border-t pt-6"><h3 className="text-xl font-bold">Da escuta à ação</h3><ol className="list-decimal space-y-3 pl-5 leading-7"><li><strong>Priorizar:</strong> começar pelas áreas Muito Ruim e Regular, preservando o recorte por curso e nível.</li><li><strong>Investigar:</strong> usar as questões com menor média para validar causas com alunos e equipes, sem atribuir causalidade apenas ao indicador.</li><li><strong>Pactuar:</strong> registrar ação, responsáveis, prazo, meta e evidências de conclusão no menu Ações.</li><li><strong>Acompanhar:</strong> verificar as melhorias e comparar o indicador no próximo ciclo avaliativo.</li></ol><p className="border-l-4 border-primary pl-4 text-lg font-medium">O resultado não encerra a avaliação: transforma a percepção dos discentes em compromissos de melhoria por curso.</p></section>}
    </>}
    {apresentando && <nav aria-label="Navegação da apresentação discente" className="fixed bottom-0 left-0 right-0 z-[101] flex flex-wrap items-center justify-center gap-3 rounded-md border bg-background p-3 shadow-sm"><Button variant="outline" size="icon" aria-label="Retroceder slide" disabled={slide === 0} onClick={() => setSlide(s => s - 1)}><ChevronLeft className="h-5 w-5" /></Button><span className="text-sm">{slide + 1} / {titulos.length}</span><span className="hidden text-sm font-medium sm:inline">{titulos[slide]}</span><Button variant="outline" size="icon" aria-label="Avançar slide" disabled={slide === titulos.length - 1} onClick={() => setSlide(s => s + 1)}><ChevronRight className="h-5 w-5" /></Button><Button variant="ghost" onClick={() => setApresentando(false)}>Sair</Button></nav>}
  </div>;
  return apresentando ? createPortal(conteudo, document.body) : conteudo;
};

export default StorytellingDiscentesSection;