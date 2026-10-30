import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AvaliacoesImportacao from '@/components/AvaliacoesImportacao';
import SugestoesImportacao from '@/components/SugestoesImportacao';
import { toast } from 'sonner';

type Importacao = Tables<'importacoes'>;
type Semestre = Tables<'semestres_letivos'>;

const ImportacoesSection = () => {
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [filtroSemestre, setFiltroSemestre] = useState('__all__');
  const [filtroNivel, setFiltroNivel] = useState('__all__');
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('__all__');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [avalOpen, setAvalOpen] = useState(false);
  const [detalhes, setDetalhes] = useState<Tables<'sugestoes'>[]>([]);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const verSugestoes = async (id: string) => {
    setDetalhes([]); setDetalheOpen(true); setDetalheLoading(true);
    const { data, error } = await supabase.from('sugestoes').select('*').eq('importacao_id', id).order('created_at').limit(1000);
    if (error) toast.error('Erro ao carregar sugestões');
    else setDetalhes(data || []);
    setDetalheLoading(false);
  };

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
    if (filtroTipo !== '__all__') query = query.eq('tipo', filtroTipo);
    const { data } = await query;
    if (data) setImportacoes(data);
    setLoading(false);
  }, [filtroSemestre, filtroNivel, filtroTipo]);

  useEffect(() => { fetchSemestres(); }, [fetchSemestres]);
  useEffect(() => { fetchImportacoes(); }, [fetchImportacoes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Importações</h2>
        <p className="text-muted-foreground text-sm mt-1">Histórico de importações realizadas</p>
        </div>
        <div className="flex gap-2"><Button onClick={() => setAvalOpen(true)} className="gap-2"><FileSpreadsheet className="h-4 w-4" />Importar Avaliações</Button><Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2"><FileSpreadsheet className="h-4 w-4" />Importar Sugestões</Button></div>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de importação</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger aria-label="Filtrar tipo de importação"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">Todos</SelectItem><SelectItem value="avaliacoes">Avaliações</SelectItem><SelectItem value="sugestoes">Sugestões</SelectItem></SelectContent></Select>
            </div>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : importacoes.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma importação encontrada</TableCell></TableRow>
              ) : (
                importacoes.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">{imp.nome_arquivo}</TableCell>
                    <TableCell><Badge variant="outline">{imp.tipo === 'sugestoes' ? 'Sugestões' : 'Avaliações'}</Badge>{imp.tipo === 'sugestoes' && <Button size="sm" variant="ghost" onClick={() => verSugestoes(imp.id)}>Ver sugestões</Button>}</TableCell>
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
      <Dialog open={avalOpen} onOpenChange={setAvalOpen}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Importar Avaliações</DialogTitle></DialogHeader><AvaliacoesImportacao onImported={() => { setAvalOpen(false); void fetchImportacoes(); }} /></DialogContent></Dialog>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Importar Sugestões</DialogTitle></DialogHeader><SugestoesImportacao onImported={() => { setUploadOpen(false); void fetchImportacoes(); }} /></DialogContent></Dialog>
      <Dialog open={detalheOpen} onOpenChange={setDetalheOpen}><DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Sugestões importadas</DialogTitle></DialogHeader>{detalheLoading ? <p>Carregando...</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow>{['Curso / Nível', 'Dimensão / Área', 'Turma / Prova', 'Questão', 'Disciplina / Professor / Coordenador', 'Sugestão'].map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader><TableBody>{detalhes.map(s => <TableRow key={s.id}><TableCell>{s.nome_curso}<br />{s.nivel}</TableCell><TableCell>{s.dimensao}<br />{s.area}</TableCell><TableCell>{s.codigo_turma}<br />{s.codigo_prova} · {s.nome_prova}</TableCell><TableCell>{s.codigo_questao} · {s.texto_questao}</TableCell><TableCell>{[s.disciplina_avaliada, s.professor_avaliado, s.coordenador_avaliado].filter(Boolean).join(' / ') || '—'}</TableCell><TableCell className="min-w-64 whitespace-pre-wrap">{s.sugestao}</TableCell></TableRow>)}</TableBody></Table></div>}</DialogContent></Dialog>
    </div>
  );
};

export default ImportacoesSection;
