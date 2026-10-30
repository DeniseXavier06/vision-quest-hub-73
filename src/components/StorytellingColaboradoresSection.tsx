import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CONCEITO_CORES, conceito, mediaQuestoes, percFavoravel, totalRespostas, type LinhaResultado } from '@/lib/medidas';
import { ChartCustomizer, legendProps, useChartCustom } from '@/components/ChartCustomizer';

const TODOS = '__todos__';
const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CONCEITOS = ['Excelente', 'Bom', 'Atende Parcialmente', 'Regular', 'Muito Ruim'];

function agrupar(rows: LinhaResultado[], campo: 'curso' | 'dimensao' | 'textoQuestao') {
  const m = new Map<string, LinhaResultado[]>();
  rows.forEach(r => { const k = r[campo] || '—'; m.set(k, [...(m.get(k) || []), r]); });
  return [...m].map(([nome, rs]) => { const media = mediaQuestoes(rs); return { nome, media, conceito: conceito(media), fav: percFavoravel(rs) }; })
    .sort((a, b) => b.media - a.media);
}

function Grafico({ id, titulo, dados }: { id: string; titulo: string; dados: ReturnType<typeof agrupar> }) {
  const ctl = useChartCustom(id, { titulo, legenda: true, series: CONCEITOS.map(c => ({ key: c, nome: c, cor: CONCEITO_CORES[c] })) });
  const { cfg } = ctl;
  const presentes = CONCEITOS.filter(c => dados.some(d => d.conceito === c));
  return <Card>
    <CardHeader className="flex-row items-center justify-between gap-2 space-y-0"><CardTitle className="text-base">{cfg.titulo}</CardTitle><ChartCustomizer ctl={ctl} /></CardHeader>
    <CardContent>
      {!dados.length ? <p className="py-10 text-center text-muted-foreground">Sem dados para este filtro.</p> :
      <ResponsiveContainer width="100%" height={Math.max(260, dados.length * 46)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 0, right: 50, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
          <YAxis dataKey="nome" type="category" width={200} tick={{ fontSize: 11 }} tickFormatter={(s: string) => s.length > 32 ? s.slice(0, 31) + '…' : s} />
          <Tooltip formatter={(v: number) => [fmt(v), 'Média']} />
          {cfg.legenda && <Legend {...legendProps(cfg)} payload={presentes.map(k => ({ value: cfg.series[k].nome, type: 'square', color: cfg.series[k].cor, id: k }))} />}
          <Bar dataKey="media" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false}>
            {dados.map(d => <Cell key={d.nome} fill={cfg.series[d.conceito]?.cor ?? CONCEITO_CORES[d.conceito]} />)}
            {cfg.rotulos && <LabelList dataKey="media" position="right" formatter={fmt} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>}
    </CardContent>
  </Card>;
}

const StorytellingColaboradoresSection = () => {
  const [rows, setRows] = useState<LinhaResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [secao, setSecao] = useState(TODOS);
  const [dimensao, setDimensao] = useState(TODOS);

  useEffect(() => {
    supabase.from('resultados').select('semestre,nivel,curso,dimensao,area,texto_questao,excelente,bom,atende_parcialmente,regular,muito_ruim,nao_se_aplica,total,media')
      .like('semestre', '2026%').or('nivel.ilike.%colabora%,tipo_avaliacao.ilike.%colabora%').limit(5000)
      .then(({ data }) => {
        setRows((data || []).map(r => ({ semestre: r.semestre, nivel: r.nivel, curso: r.curso, dimensao: r.dimensao, area: r.area, textoQuestao: r.texto_questao,
          excelente: r.excelente, bom: r.bom, atendeParcialmente: r.atende_parcialmente, regular: r.regular, muitoRuim: r.muito_ruim, naoSeAplica: r.nao_se_aplica, total: r.total, media: Number(r.media) })));
        setLoading(false);
      });
  }, []);

  const secoes = useMemo(() => [...new Set(rows.map(r => r.curso))].sort(), [rows]);
  const dimensoes = useMemo(() => [...new Set(rows.filter(r => secao === TODOS || r.curso === secao).map(r => r.dimensao))].sort(), [rows, secao]);
  const filtrados = useMemo(() => rows.filter(r => (secao === TODOS || r.curso === secao) && (dimensao === TODOS || r.dimensao === dimensao)), [rows, secao, dimensao]);
  const porSecao = useMemo(() => agrupar(filtrados, 'curso'), [filtrados]);
  const porDimensao = useMemo(() => agrupar(filtrados, 'dimensao'), [filtrados]);
  const questoes = useMemo(() => agrupar(filtrados, 'textoQuestao'), [filtrados]);
  const prioridades = questoes.filter(q => q.media > 0 && q.media < 4.1).sort((a, b) => a.media - b.media);
  const media = mediaQuestoes(filtrados);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!rows.length) return <p className="py-16 text-center text-muted-foreground">Ainda não há resultados de colaboradores de 2026. Importe em Importações → Importar Avaliações.</p>;

  const melhor = porSecao[0], pior = porSecao[porSecao.length - 1];
  return <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-heading font-bold">Colaboradores/2026 — o que a equipe revela</h2>
      <p className="text-sm text-muted-foreground">Percepção dos colaboradores por seção e dimensão, para orientar planos de ação dos gestores.</p>
    </div>

    <div className="flex flex-wrap gap-4">
      <div className="w-64"><label className="mb-1 block text-xs font-medium text-muted-foreground">Seção</label>
        <SearchableSelect value={secao} onValueChange={v => { setSecao(v); setDimensao(TODOS); }} options={[{ value: TODOS, label: 'Todas' }, ...secoes.map(s => ({ value: s, label: s }))]} /></div>
      <div className="w-64"><label className="mb-1 block text-xs font-medium text-muted-foreground">Dimensão</label>
        <SearchableSelect value={dimensao} onValueChange={setDimensao} options={[{ value: TODOS, label: 'Todas' }, ...dimensoes.map(s => ({ value: s, label: s }))]} /></div>
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      {[{ l: 'Média geral', v: fmt(media), c: conceito(media) }, { l: '% favorável', v: `${fmt(percFavoravel(filtrados))}%` },
        { l: 'Respostas', v: totalRespostas(filtrados).toLocaleString('pt-BR') }, { l: 'Questões prioritárias', v: String(prioridades.length) }].map(k =>
        <Card key={k.l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.l}</p><p className="text-xl font-bold">{k.v}</p>{k.c && <Badge variant="outline">{k.c}</Badge>}</CardContent></Card>)}
    </div>

    <Card><CardHeader><CardTitle className="text-base">Análise</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
        <p>A média dos colaboradores no recorte é <strong className="text-foreground">{fmt(media)}</strong> ({conceito(media)}), com {fmt(percFavoravel(filtrados))}% de respostas favoráveis (Excelente + Bom).</p>
        {porSecao.length > 1 && <p><strong className="text-foreground">Seções:</strong> {melhor.nome} lidera ({fmt(melhor.media)}); {pior.nome} tem a menor média ({fmt(pior.media)}).</p>}
        {porDimensao.length > 0 && <p><strong className="text-foreground">Dimensões:</strong> destaque para {porDimensao[0].nome} ({fmt(porDimensao[0].media)}); atenção para {porDimensao[porDimensao.length - 1].nome} ({fmt(porDimensao[porDimensao.length - 1].media)}).</p>}
        <p><strong className="text-foreground">Ação:</strong> {prioridades.length ? `${prioridades.length} questões abaixo de Bom (média < 4,1) devem compor os planos de ação.` : 'nenhuma questão abaixo de Bom; foco em manter os resultados.'}</p>
      </CardContent></Card>

    <Grafico id="sc-secao" titulo="Médias por seção" dados={porSecao} />
    <Grafico id="sc-dimensao" titulo="Médias por dimensão" dados={porDimensao} />

    <Card><CardHeader><CardTitle className="text-base">Questões prioritárias (Atende Parcialmente, Regular e Muito Ruim)</CardTitle></CardHeader>
      <CardContent>{!prioridades.length ? <p className="text-muted-foreground">Nenhuma questão abaixo de Bom neste recorte.</p> :
        <Table><TableHeader><TableRow><TableHead>Questão</TableHead><TableHead className="text-right">Média</TableHead><TableHead>Conceito</TableHead></TableRow></TableHeader>
          <TableBody>{prioridades.map(q => <TableRow key={q.nome}><TableCell>{q.nome}</TableCell><TableCell className="text-right">{fmt(q.media)}</TableCell><TableCell><Badge variant="outline">{q.conceito}</Badge></TableCell></TableRow>)}</TableBody></Table>}
      </CardContent></Card>
  </div>;
};

export default StorytellingColaboradoresSection;
