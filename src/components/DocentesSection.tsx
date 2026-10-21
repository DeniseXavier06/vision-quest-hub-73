import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { Loader2, GraduationCap, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type LinhaResultado, mediaHierarquica, mediaQuestoes, percFavoravel, totalRespostas, conceito, corMedia,
} from '@/lib/medidas';

interface LinhaDocente extends LinhaResultado {
  professor: string;
  disciplina: string;
}

const TODOS = '__todos__';
const CORES_SEMESTRE = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#6c5ce7', '#2d8a9e'];

type Grupo = 'curso' | 'dimensao' | 'area' | 'professor' | 'disciplina';
const GRUPOS: { id: Grupo; rotulo: string }[] = [
  { id: 'curso', rotulo: 'Média por Curso' },
  { id: 'dimensao', rotulo: 'Média por Eixo / Dimensão' },
  { id: 'area', rotulo: 'Média por Área' },
  { id: 'professor', rotulo: 'Média por Professor' },
  { id: 'disciplina', rotulo: 'Média por Disciplina' },
];
const CAMPO_GRUPO: Record<Grupo, keyof LinhaDocente> = {
  curso: 'curso', dimensao: 'dimensao', area: 'area', professor: 'professor', disciplina: 'disciplina',
};

interface Props { perfil?: 'docentes' | 'discentes' }
const DocentesSection = ({ perfil = 'docentes' }: Props) => {
  const isDisc = perfil === 'discentes';
  const [rows, setRows] = useState<LinhaDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [nivel, setNivel] = useState(TODOS);
  const [semestresSel, setSemestresSel] = useState<string[]>([]);
  const [curso, setCurso] = useState(TODOS);
  const [dimensao, setDimensao] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [professor, setProfessor] = useState(TODOS);
  const [disciplina, setDisciplina] = useState(TODOS);

  useEffect(() => {
    (async () => {
      let all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from('resultados')
          .select('*')
          .or(isDisc ? 'nivel.ilike.%aluno%,nivel.ilike.%discente%' : 'nivel.ilike.%professor%')
          .range(from, from + 999);
        if (error || !data?.length) break;
        all = all.concat(data);
        if (data.length < 1000) break;
      }
      setRows(all.map((r) => ({
        semestre: r.semestre, nivel: r.nivel, curso: r.curso, dimensao: r.dimensao, area: r.area,
        textoQuestao: r.texto_questao, excelente: r.excelente, bom: r.bom, atendeParcialmente: r.atende_parcialmente,
        regular: r.regular, muitoRuim: r.muito_ruim, naoSeAplica: r.nao_se_aplica, total: r.total, media: Number(r.media),
        professor: r.professor || '', disciplina: r.disciplina || '',
      })));
      setLoading(false);
    })();
  }, [isDisc]);

  const opcoes = useMemo(() => {
    const uniq = (k: keyof LinhaDocente) => [...new Set(rows.map((r) => String(r[k])).filter(Boolean))].sort();
    return { niveis: uniq('nivel'), semestres: uniq('semestre'), cursos: uniq('curso'), dimensoes: uniq('dimensao'), areas: uniq('area'), professores: uniq('professor'), disciplinas: uniq('disciplina') };
  }, [rows]);

  const semestresAtivos = semestresSel.length ? semestresSel : opcoes.semestres;

  const filtrado = useMemo(() => rows.filter((r) =>
    (nivel === TODOS || r.nivel === nivel) &&
    (semestresSel.length === 0 || semestresSel.includes(r.semestre)) &&
    (curso === TODOS || r.curso === curso) &&
    (dimensao === TODOS || r.dimensao === dimensao) &&
    (area === TODOS || r.area === area) &&
    (professor === TODOS || r.professor === professor) &&
    (disciplina === TODOS || r.disciplina === disciplina),
  ), [rows, nivel, semestresSel, curso, dimensao, area, professor, disciplina]);

  const comparativo = semestresAtivos.length > 1;

  // Gráfico agrupado: eixo X = grupo; uma barra por semestre quando comparativo.
  const dadosPorGrupo = useMemo(() => {
    const out = {} as Record<Grupo, any[]>;
    for (const g of GRUPOS) {
      const campo = CAMPO_GRUPO[g.id];
      const map = new Map<string, LinhaDocente[]>();
      filtrado.forEach((r) => {
        const k = String(r[campo] || '(sem valor)');
        map.set(k, [...(map.get(k) || []), r]);
      });
      out[g.id] = [...map.entries()].map(([nome, rs]) => {
        const item: any = { nome, media: mediaHierarquica(rs) };
        semestresAtivos.forEach((s) => {
          const rsS = rs.filter((r) => r.semestre === s);
          item[s] = rsS.length ? mediaHierarquica(rsS) : null;
        });
        return item;
      }).sort((a, b) => b.media - a.media);
    }
    return out;
  }, [filtrado, semestresAtivos]);

  const geral = useMemo(() => semestresAtivos.map((s) => {
    const rs = filtrado.filter((r) => r.semestre === s);
    const m = mediaHierarquica(rs);
    return { semestre: s, media: m, conceito: conceito(m), favoravel: percFavoravel(rs), respostas: totalRespostas(rs) };
  }), [filtrado, semestresAtivos]);

  // Tabela de questões: média por semestre + média geral + conceito.
  const tabelaQuestoes = useMemo(() => {
    const map = new Map<string, LinhaDocente[]>();
    filtrado.forEach((r) => map.set(r.textoQuestao, [...(map.get(r.textoQuestao) || []), r]));
    return [...map.entries()].map(([questao, rs]) => {
      const porSemestre = semestresAtivos.map((s) => {
        const rsS = rs.filter((r) => r.semestre === s);
        return rsS.length ? mediaQuestoes(rsS) : null;
      });
      const m = mediaQuestoes(rs);
      return { questao, dimensao: rs[0].dimensao, area: rs[0].area, porSemestre, media: m, conceito: conceito(m), respostas: totalRespostas(rs) };
    }).sort((a, b) => a.questao.localeCompare(b.questao));
  }, [filtrado, semestresAtivos]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const toggleSemestre = (s: string) =>
    setSemestresSel((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const mediaGeral = mediaHierarquica(filtrado);

  const renderGrafico = (g: Grupo, rotulo: string) => {
    const dados = dadosPorGrupo[g];
    return (
      <Card key={g}>
        <CardHeader className="pb-2"><CardTitle className="text-base">{rotulo}</CardTitle></CardHeader>
        <CardContent>
          {dados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Sem dados para o filtro selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, dados.length * 36)}>
              <BarChart data={dados} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="nome" width={220} tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => (v.length > 34 ? v.slice(0, 34) + '…' : v)} />
                <Tooltip formatter={(v: number) => (v == null ? '—' : Number(v).toFixed(2))} />
                {comparativo && <Legend />}
                {comparativo ? (
                  semestresAtivos.map((s, i) => (
                    <Bar key={s} dataKey={s} name={s} fill={CORES_SEMESTRE[i % CORES_SEMESTRE.length]} radius={[0, 4, 4, 0]} />
                  ))
                ) : (
                  <Bar dataKey="media" name="Média" radius={[0, 4, 4, 0]}
                    label={{ position: 'right', fontSize: 11, formatter: (v: number) => v.toFixed(2) }}>
                    {dados.map((d, i) => <Cell key={i} fill={corMedia(d.media)} />)}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />{isDisc ? 'Discentes' : 'Docentes'}</h3>
        <p className="text-sm text-muted-foreground">{isDisc ? 'Resultados dos alunos presenciais e EAD.' : 'Resultados dos perfis Professores e Professores EAD.'} Selecione vários semestres para comparar.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <SearchableSelect value={nivel} onValueChange={setNivel} placeholder="Nível" className="w-[180px]"
          options={[{ value: TODOS, label: 'Todos os níveis' }, ...opcoes.niveis.map((s) => ({ value: s, label: s }))]} />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-between">
              {semestresSel.length === 0 ? 'Todos os semestres' : `${semestresSel.length} semestre(s)`}
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2">
              {opcoes.semestres.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={semestresSel.includes(s)} onCheckedChange={() => toggleSemestre(s)} />
                  {s}
                </label>
              ))}
              {semestresSel.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setSemestresSel([])}>Limpar seleção</Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <SearchableSelect value={curso} onValueChange={setCurso} placeholder="Curso" className="w-[200px]"
          options={[{ value: TODOS, label: 'Todos os cursos' }, ...opcoes.cursos.map((s) => ({ value: s, label: s }))]} />
        <SearchableSelect value={dimensao} onValueChange={setDimensao} placeholder="Eixo / Dimensão" className="w-[200px]"
          options={[{ value: TODOS, label: 'Todos os eixos' }, ...opcoes.dimensoes.map((s) => ({ value: s, label: s }))]} />
        <SearchableSelect value={area} onValueChange={setArea} placeholder="Área" className="w-[200px]"
          options={[{ value: TODOS, label: 'Todas as áreas' }, ...opcoes.areas.map((s) => ({ value: s, label: s }))]} />
        {!isDisc && <>
        <SearchableSelect value={professor} onValueChange={setProfessor} placeholder="Professor" className="w-[200px]"
          options={[{ value: TODOS, label: 'Todos os professores' }, ...opcoes.professores.map((s) => ({ value: s, label: s }))]} />
        <SearchableSelect value={disciplina} onValueChange={setDisciplina} placeholder="Disciplina" className="w-[200px]"
          options={[{ value: TODOS, label: 'Todas as disciplinas' }, ...opcoes.disciplinas.map((s) => ({ value: s, label: s }))]} />
        </>}
        <Button variant="ghost" size="sm" onClick={() => { setNivel(TODOS); setSemestresSel([]); setCurso(TODOS); setDimensao(TODOS); setArea(TODOS); setProfessor(TODOS); setDisciplina(TODOS); }}>Limpar filtros</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Média Geral', v: mediaGeral.toFixed(2) },
          { l: 'Conceito', v: conceito(mediaGeral) },
          { l: '% Favorável', v: `${percFavoravel(filtrado).toFixed(1)}%` },
          { l: 'Total de Respostas', v: totalRespostas(filtrado).toLocaleString('pt-BR') },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className="text-xl font-bold">{k.v}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Visão geral por semestre</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Semestre</TableHead><TableHead className="text-right">Média</TableHead>
              <TableHead>Conceito</TableHead><TableHead className="text-right">% Favorável</TableHead><TableHead className="text-right">Respostas</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {geral.map((g) => (
                <TableRow key={g.semestre}>
                  <TableCell className="font-medium">{g.semestre}</TableCell>
                  <TableCell className="text-right font-medium">{g.media.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" style={{ borderColor: corMedia(g.media), color: corMedia(g.media) }}>{g.conceito}</Badge></TableCell>
                  <TableCell className="text-right">{g.favoravel.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{g.respostas.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {GRUPOS.filter((g) => !isDisc || (g.id !== 'professor' && g.id !== 'disciplina')).map((g) => renderGrafico(g.id, g.rotulo))}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Questões — média e conceito</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Questão</TableHead>
              <TableHead>Eixo / Dimensão</TableHead>
              <TableHead>Área</TableHead>
              {semestresAtivos.map((s) => <TableHead key={s} className="text-right">{s}</TableHead>)}
              <TableHead className="text-right">Média</TableHead>
              <TableHead>Conceito</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {tabelaQuestoes.map((q) => (
                <TableRow key={q.questao}>
                  <TableCell className="max-w-md">{q.questao}</TableCell>
                  <TableCell className="text-sm">{q.dimensao}</TableCell>
                  <TableCell className="text-sm">{q.area}</TableCell>
                  {q.porSemestre.map((m, i) => (
                    <TableCell key={i} className="text-right">{m == null ? '—' : m.toFixed(2)}</TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{q.media.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" style={{ borderColor: corMedia(q.media), color: corMedia(q.media) }}>{q.conceito}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocentesSection;
