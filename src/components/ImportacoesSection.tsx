import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Importacao = Tables<'importacoes'>;
type Semestre = Tables<'semestres_letivos'>;

const ImportacoesSection = () => {
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [filtroSemestre, setFiltroSemestre] = useState('__all__');
  const [filtroNivel, setFiltroNivel] = useState('__all__');
  const [loading, setLoading] = useState(false);

  const fetchSemestres = useCallback(async () => {
    const { data } = await supabase.from('semestres_letivos').select('*').order('ano', { ascending: false }).order('periodo', { ascending: false });
    if (data) setSemestres(data);
  }, []);

  const fetchImportacoes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('importacoes').select('*').order('created_at', { ascending: false });
    if (filtroSemestre !== '__all__') {
      query = query.eq('periodo', filtroSemestre);
    }
    if (filtroNivel !== '__all__') {
      query = query.eq('perfil', filtroNivel);
    }
    const { data } = await query;
    if (data) setImportacoes(data);
    setLoading(false);
  }, [filtroSemestre, filtroNivel]);

  useEffect(() => { fetchSemestres(); }, [fetchSemestres]);
  useEffect(() => { fetchImportacoes(); }, [fetchImportacoes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Importações</h2>
        <p className="text-muted-foreground text-sm mt-1">Histórico de importações realizadas</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-56">
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
            <div className="w-56">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível / Perfil</label>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : importacoes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma importação encontrada</TableCell></TableRow>
              ) : (
                importacoes.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">{imp.nome_arquivo}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{imp.perfil}</Badge></TableCell>
                    <TableCell>{imp.periodo}</TableCell>
                    <TableCell>{imp.total_registros}</TableCell>
                    <TableCell>{new Date(imp.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-48 truncate">{imp.observacoes || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportacoesSection;
