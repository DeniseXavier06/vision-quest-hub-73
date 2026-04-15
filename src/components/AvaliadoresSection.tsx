import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search } from 'lucide-react';

const AvaliadoresSection = () => {
  const [avaliadores, setAvaliadores] = useState<any[]>([]);
  const [semestres, setSemestres] = useState<any[]>([]);
  const [filtroSemestre, setFiltroSemestre] = useState('__all__');
  const [filtroNivel, setFiltroNivel] = useState('__all__');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('semestres_letivos').select('*').order('ano', { ascending: false }).order('periodo', { ascending: false })
      .then(({ data }) => { if (data) setSemestres(data); });
  }, []);

  const fetchAvaliadores = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('avaliadores_sessao').select('*').order('nome');
    if (filtroSemestre !== '__all__') query = query.eq('semestre', filtroSemestre);
    if (filtroNivel !== '__all__') query = query.eq('nivel', filtroNivel);
    if (busca.trim()) query = query.or(`nome.ilike.%${busca.trim()}%,matricula.ilike.%${busca.trim()}%,email.ilike.%${busca.trim()}%`);
    const { data } = await query;
    if (data) setAvaliadores(data);
    setLoading(false);
  }, [filtroSemestre, filtroNivel, busca]);

  useEffect(() => { fetchAvaliadores(); }, [fetchAvaliadores]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Avaliadores</h2>
        <p className="text-muted-foreground text-sm mt-1">Pessoas importadas para avaliação</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-56">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
              <Input placeholder="Nome, matrícula ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semestre</label>
              <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {semestres.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível</label>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="ead">EAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Avaliadores
            <Badge variant="secondary" className="ml-auto">{avaliadores.length} registro(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Semestre</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Cód. Turma</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : avaliadores.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum avaliador encontrado</TableCell></TableRow>
                ) : (
                  avaliadores.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.matricula}</TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-xs">{a.cpf || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{a.nivel || '—'}</Badge></TableCell>
                      <TableCell className="text-xs">{a.semestre || '—'}</TableCell>
                      <TableCell className="text-xs">{a.curso || '—'}</TableCell>
                      <TableCell className="text-xs">{a.periodo || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.codigo_turma || '—'}</TableCell>
                      <TableCell className="text-xs">{a.email || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvaliadoresSection;
