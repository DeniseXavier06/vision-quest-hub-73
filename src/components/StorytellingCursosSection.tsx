import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Curso = { nome: string; matriculados: number; avaliadores: number; avaliacoes: number };

const presencial: Curso[] = [
  { nome: 'Bacharelado em Administração', matriculados: 121, avaliadores: 120, avaliacoes: 74 },
  { nome: 'Bacharelado em Biomedicina', matriculados: 171, avaliadores: 170, avaliacoes: 129 },
  { nome: 'Bacharelado em Direito', matriculados: 484, avaliadores: 481, avaliacoes: 335 },
  { nome: 'Bacharelado em Enfermagem', matriculados: 397, avaliadores: 396, avaliacoes: 315 },
  { nome: 'Bacharelado em Farmácia', matriculados: 170, avaliadores: 170, avaliacoes: 162 },
  { nome: 'Bacharelado em Fisioterapia', matriculados: 308, avaliadores: 306, avaliacoes: 188 },
  { nome: 'Bacharelado em Nutrição', matriculados: 115, avaliadores: 115, avaliacoes: 95 },
  { nome: 'Bacharelado em Odontologia', matriculados: 291, avaliadores: 291, avaliacoes: 283 },
  { nome: 'Bacharelado em Psicologia', matriculados: 394, avaliadores: 394, avaliacoes: 361 },
  { nome: 'Bacharelado em Sistema de Informação', matriculados: 204, avaliadores: 202, avaliacoes: 168 },
];

const ead: Curso[] = [
  { nome: 'Bacharelado em Administração', matriculados: 73, avaliadores: 70, avaliacoes: 13 },
  { nome: 'Bacharelado em Biomedicina', matriculados: 12, avaliadores: 11, avaliacoes: 1 },
  { nome: 'Bacharelado em Educação Física', matriculados: 48, avaliadores: 47, avaliacoes: 10 },
  { nome: 'Bacharelado em Farmácia', matriculados: 52, avaliadores: 51, avaliacoes: 12 },
  { nome: 'Licenciatura em Pedagogia', matriculados: 17, avaliadores: 17, avaliacoes: 7 },
  { nome: 'Tecnologia em Análise e Desenvolvimento de Sistemas', matriculados: 35, avaliadores: 31, avaliacoes: 7 },
  { nome: 'Tecnologia em Gestão Comercial', matriculados: 3, avaliadores: 2, avaliacoes: 0 },
  { nome: 'Tecnologia em Gestão da Tecnologia da Informação', matriculados: 11, avaliadores: 9, avaliacoes: 4 },
  { nome: 'Tecnologia em Gestão de Recursos Humanos', matriculados: 11, avaliadores: 8, avaliacoes: 0 },
  { nome: 'Tecnologia em Gestão Financeira', matriculados: 4, avaliadores: 3, avaliacoes: 1 },
  { nome: 'Tecnologia em Gestão Pública', matriculados: 7, avaliadores: 6, avaliacoes: 0 },
  { nome: 'Tecnologia em Logística', matriculados: 5, avaliadores: 5, avaliacoes: 0 },
  { nome: 'Tecnologia em Marketing Digital', matriculados: 8, avaliadores: 7, avaliacoes: 3 },
];

const pct = (c: Curso) => (c.avaliadores ? (c.avaliacoes / c.avaliadores) * 100 : 0);
const fmt = (v: number) => `${v.toFixed(2).replace('.', ',')}%`;
const faixa = (v: number) =>
  v >= 85 ? { label: 'Destaque', cls: 'bg-success/15 text-success border-success/30' }
  : v >= 70 ? { label: 'Adequado', cls: 'bg-info/15 text-info border-info/30' }
  : v >= 40 ? { label: 'Atenção', cls: 'bg-warning/15 text-warning border-warning/30' }
  : { label: 'Crítico', cls: 'bg-destructive/15 text-destructive border-destructive/30' };

const StorytellingCursosSection = () => {
  const [mod, setMod] = useState<'presencial' | 'ead'>('presencial');
  const lista = mod === 'presencial' ? presencial : ead;
  const ordenada = [...lista].sort((a, b) => pct(b) - pct(a));
  const tot = lista.reduce((s, c) => ({ m: s.m + c.matriculados, a: s.a + c.avaliadores, v: s.v + c.avaliacoes }), { m: 0, a: 0, v: 0 });
  const geral = (tot.v / tot.a) * 100;
  const zerados = lista.filter((c) => c.avaliacoes === 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Participação por curso — 2026</h2>
          <p className="text-sm text-muted-foreground">Alunos avaliadores × avaliações realizadas, por modalidade.</p>
        </div>
        <Tabs value={mod} onValueChange={(v) => setMod(v as 'presencial' | 'ead')}>
          <TabsList>
            <TabsTrigger value="presencial">Presencial</TabsTrigger>
            <TabsTrigger value="ead">EAD</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: 'Participação geral', v: fmt(geral) },
          { l: 'Matriculados', v: tot.m.toLocaleString('pt-BR') },
          { l: 'Avaliações realizadas', v: tot.v.toLocaleString('pt-BR') },
          { l: 'Maior adesão', v: `${ordenada[0].nome.replace(/^(Bacharelado|Licenciatura|Tecnologia) em /, '')} (${fmt(pct(ordenada[0]))})` },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className="text-lg font-bold">{k.v}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de participação</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ordenada.map((c) => {
            const v = pct(c); const f = faixa(v);
            return (
              <div key={c.nome} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{c.nome}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className={f.cls}>{f.label}</Badge>
                    <strong className={cn(v < geral && 'text-destructive')}>{fmt(v)}</strong>
                  </span>
                </div>
                <Progress value={v} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tabela por curso</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Curso</TableHead>
              <TableHead className="text-right">Matriculados</TableHead>
              <TableHead className="text-right">Avaliadores</TableHead>
              <TableHead className="text-right">Avaliações</TableHead>
              <TableHead className="text-right">% Avaliações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lista.map((c) => (
                <TableRow key={c.nome}>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell className="text-right">{c.matriculados}</TableCell>
                  <TableCell className="text-right">{c.avaliadores}</TableCell>
                  <TableCell className="text-right">{c.avaliacoes}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(pct(c))}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{tot.m}</TableCell>
                <TableCell className="text-right">{tot.a}</TableCell>
                <TableCell className="text-right">{tot.v}</TableCell>
                <TableCell className="text-right">{fmt(geral)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>O que os cursos revelam?</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          {mod === 'presencial' ? (
            <>
              <p><strong className="text-foreground">Destaques:</strong> Odontologia (97,25%), Farmácia (95,29%) e Psicologia (91,62%) mostram cultura avaliativa consolidada.</p>
              <p><strong className="text-foreground">Atenção:</strong> Fisioterapia (61,44%), Administração (61,67%) e Direito (69,65%) ficam abaixo da média; Direito, maior curso (481 avaliadores), pesa no resultado geral.</p>
              <p><strong className="text-foreground">Ação:</strong> mobilização com coordenadores e representantes de turma nesses três cursos, com acompanhamento diário da adesão.</p>
            </>
          ) : (
            <>
              <p><strong className="text-foreground">Destaques relativos:</strong> Gestão da TI (44,44%), Marketing Digital (42,86%) e Pedagogia (41,18%) lideram, mas ainda abaixo de 50%.</p>
              <p><strong className="text-foreground">Crítico:</strong> {zerados.length} cursos sem nenhuma avaliação ({zerados.map((c) => c.nome.replace('Tecnologia em ', '')).join(', ')}); Administração EAD, maior curso (70 avaliadores), tem só 18,57%.</p>
              <p><strong className="text-foreground">Ação:</strong> avisos no AVA, contato direto por WhatsApp/e-mail e tutoria ativa, priorizando Administração, Biomedicina e os cursos zerados.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorytellingCursosSection;
