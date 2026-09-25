import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ChevronRight, Home, Loader2, Sigma } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type LinhaResultado, type NivelDrill, ORDEM_DRILL, ROTULO_DRILL, CATALOGO_MEDIDAS,
  agruparPor, filtrarCaminho, mediaHierarquica, percFavoravel, totalRespostas, conceito, corMedia,
} from '@/lib/medidas';

const TODOS = '__todos__';

const MedidasDrillSection = () => {
  const [rows, setRows] = useState<LinhaResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [semestre, setSemestre] = useState(TODOS);
  const [nivel, setNivel] = useState(TODOS);
  const [caminho, setCaminho] = useState<{ nivel: NivelDrill; valor: string }[]>([]);

  useEffect(() => {
    (async () => {
      let all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('resultados').select('*').range(from, from + 999);
        if (error || !data?.length) break;
        all = all.concat(data);
        if (data.length < 1000) break;
      }
      setRows(all.map((r) => ({
        semestre: r.semestre, nivel: r.nivel, curso: r.curso, dimensao: r.dimensao, area: r.area,
        textoQuestao: r.texto_questao, excelente: r.excelente, bom: r.bom, atendeParcialmente: r.atende_parcialmente,
        regular: r.regular, muitoRuim: r.muito_ruim, naoSeAplica: r.nao_se_aplica, total: r.total, media: Number(r.media),
      })));
      setLoading(false);
    })();
  }, []);

  const semestres = useMemo(() => [...new Set(rows.map((r) => r.semestre).filter(Boolean))].sort(), [rows]);
  const niveis = useMemo(() => [...new Set(rows.map((r) => r.nivel).filter(Boolean))].sort(), [rows]);

  const base = useMemo(
    () => rows.filter((r) => (semestre === TODOS || r.semestre === semestre) && (nivel === TODOS || r.nivel === nivel)),
    [rows, semestre, nivel],
  );
  const escopo = useMemo(() => filtrarCaminho(base, caminho), [base, caminho]);
  const nivelAtual = ORDEM_DRILL[caminho.length] as NivelDrill | undefined;
  const dados = useMemo(
    () => (nivelAtual ? agruparPor(escopo, nivelAtual).sort((a, b) => b.media - a.media) : []),
    [escopo, nivelAtual],
  );

  const drill = (valor: string) => {
    if (nivelAtual && nivelAtual !== 'questao') setCaminho([...caminho, { nivel: nivelAtual, valor }]);
  };

  const mediaEscopo = mediaHierarquica(escopo);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Medidas & Drill-down</h1>
        <p className="text-sm text-muted-foreground">Modelo único de medidas: os mesmos números em todas as telas. Clique nas barras para detalhar Área → Dimensão → Curso → Questão.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={semestre} onValueChange={(v) => { setSemestre(v); setCaminho([]); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Semestre" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os semestres</SelectItem>
            {semestres.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={nivel} onValueChange={(v) => { setNivel(v); setCaminho([]); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os níveis</SelectItem>
            {niveis.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Média Hierárquica', v: mediaEscopo.toFixed(2) },
          { l: 'Conceito', v: conceito(mediaEscopo) },
          { l: '% Favorável', v: `${percFavoravel(escopo).toFixed(1)}%` },
          { l: 'Total de Respostas', v: totalRespostas(escopo).toLocaleString('pt-BR') },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className="text-xl font-bold">{k.v}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" onClick={() => setCaminho([])}><Home className="w-4 h-4 mr-1" />Início</Button>
            {caminho.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Button variant="ghost" size="sm" onClick={() => setCaminho(caminho.slice(0, i + 1))}>
                  <span className="text-muted-foreground mr-1">{ROTULO_DRILL[c.nivel]}:</span>
                  <span className="max-w-[180px] truncate">{c.valor}</span>
                </Button>
              </span>
            ))}
          </div>
          <CardTitle className="text-base">Média por {nivelAtual ? ROTULO_DRILL[nivelAtual] : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {dados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Sem dados para o filtro selecionado.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(260, dados.length * 32)}>
                <BarChart data={dados} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis type="category" dataKey="nome" width={220} tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => (v.length > 34 ? v.slice(0, 34) + '…' : v)} />
                  <Tooltip formatter={(v: number) => v.toFixed(2)} />
                  <Bar dataKey="media" radius={[0, 4, 4, 0]} cursor={nivelAtual !== 'questao' ? 'pointer' : 'default'}
                    onClick={(d: any) => drill(d.nome)} label={{ position: 'right', fontSize: 11, formatter: (v: number) => v.toFixed(2) }}>
                    {dados.map((d, i) => <Cell key={i} fill={corMedia(d.media)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{nivelAtual && ROTULO_DRILL[nivelAtual]}</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead>Conceito</TableHead>
                  <TableHead className="text-right">% Favorável</TableHead>
                  <TableHead className="text-right">Respostas</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {dados.map((d) => (
                    <TableRow key={d.nome} className={nivelAtual !== 'questao' ? 'cursor-pointer' : ''} onClick={() => drill(d.nome)}>
                      <TableCell className="max-w-md">{d.nome}</TableCell>
                      <TableCell className="text-right font-medium">{d.media.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{d.conceito}</Badge></TableCell>
                      <TableCell className="text-right">{d.favoravel.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{d.respostas.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sigma className="w-4 h-4" />Catálogo de medidas oficiais</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Medida</TableHead><TableHead>Fórmula</TableHead><TableHead>Uso</TableHead></TableRow></TableHeader>
            <TableBody>
              {CATALOGO_MEDIDAS.map((m) => (
                <TableRow key={m.nome}><TableCell className="font-medium">{m.nome}</TableCell><TableCell className="font-mono text-xs">{m.formula}</TableCell><TableCell className="text-sm text-muted-foreground">{m.uso}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedidasDrillSection;
