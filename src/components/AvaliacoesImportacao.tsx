import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PERFIS = [
  { value: 'Alunos', label: 'Aluno' }, { value: 'Professores', label: 'Professor' },
  { value: 'Colaboradores', label: 'Colaborador' }, { value: 'Coordenadores', label: 'Coordenador' },
];
const NOTAS = ['EXCELENTE', 'BOM', 'ATENDE_PARCIALMENTE', 'REGULAR', 'MUITO_RUIM_PÉSSIMO', 'NÃO_SE_APLICA', 'TOTAL', 'MEDIA', 'CONCEITO'];
export const CAMPOS_AVALIACAO: Record<string, string[]> = {
  Colaboradores: ['NOME_SECAO', 'NIVEL', 'DIMENSAO', 'CODIGO_PROVA', 'NOME_PROVA', 'CODIGO_QUESTAO', 'NUMERO_QUESTAO', 'TEXTO_QUESTAO', ...NOTAS],
  padrao: ['SEMESTRE', 'NOME_CURSO', 'NIVEL', 'DIMENSAO', 'AREA', 'TEXTO_QUESTAO', 'PROFESSOR_AVALIADO', 'DISCIPLINA_AVALIADA', ...NOTAS],
};
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };

export default function AvaliacoesImportacao({ onImported }: { onImported?: () => void }) {
  const [semestres, setSemestres] = useState<Tables<'semestres_letivos'>[]>([]);
  const [periodo, setPeriodo] = useState('');
  const [perfil, setPerfil] = useState('Colaboradores');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const campos = CAMPOS_AVALIACAO[perfil] ?? CAMPOS_AVALIACAO.padrao;

  useEffect(() => { supabase.from('semestres_letivos').select('*').order('ano', { ascending: false }).then(({ data }) => setSemestres(data || [])); }, []);
  useEffect(() => {
    setMapping(Object.fromEntries(campos.map(c => [c, columns.find(h => norm(h) === norm(c)) || ''])));
  }, [campos, columns]);

  const upload = async (f?: File) => {
    setFile(null); setRows([]); setColumns([]);
    if (!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    if (!json.length) { toast.error('Arquivo vazio'); return; }
    setFile(f); setRows(json); setColumns(Object.keys(json[0]));
  };

  const linhas = useMemo(() => {
    const g = (r: Record<string, unknown>, c: string) => (mapping[c] ? r[mapping[c]] : '') ?? '';
    const colab = perfil === 'Colaboradores';
    return rows.map(r => ({
      semestre: String(g(r, 'SEMESTRE')).trim() || periodo,
      nivel: String(g(r, 'NIVEL')).trim() || perfil,
      curso: String(g(r, colab ? 'NOME_SECAO' : 'NOME_CURSO')),
      dimensao: String(g(r, 'DIMENSAO')),
      area: String(colab ? g(r, 'NOME_SECAO') : g(r, 'AREA')),
      texto_questao: String(g(r, 'TEXTO_QUESTAO')),
      professor: colab ? null : String(g(r, 'PROFESSOR_AVALIADO')) || null,
      disciplina: colab ? null : String(g(r, 'DISCIPLINA_AVALIADA')) || null,
      excelente: num(g(r, 'EXCELENTE')), bom: num(g(r, 'BOM')), atende_parcialmente: num(g(r, 'ATENDE_PARCIALMENTE')),
      regular: num(g(r, 'REGULAR')), muito_ruim: num(g(r, 'MUITO_RUIM_PÉSSIMO')), nao_se_aplica: num(g(r, 'NÃO_SE_APLICA')),
      total: num(g(r, 'TOTAL')), media: num(g(r, 'MEDIA')), conceito: String(g(r, 'CONCEITO')), tipo_avaliacao: perfil,
    })).filter(l => l.texto_questao.trim());
  }, [rows, mapping, perfil, periodo]);

  const importar = async () => {
    if (!file || !periodo || !linhas.length) return;
    setBusy(true);
    try {
      const { data: imp, error } = await supabase.from('importacoes').insert({ periodo, perfil, nome_arquivo: file.name, total_registros: linhas.length, tipo: 'avaliacoes' }).select().single();
      if (error || !imp) throw error ?? new Error('Erro ao registrar importação');
      for (let i = 0; i < linhas.length; i += 500) {
        const { error: e } = await supabase.from('resultados').insert(linhas.slice(i, i + 500).map(l => ({ ...l, importacao_id: imp.id })));
        if (e) throw e;
      }
      toast.success(`${linhas.length} registros importados! Já disponíveis em Resultados, Análise e Storytelling.`);
      setFile(null); setRows([]); setColumns([]); onImported?.();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao importar'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label>Semestre</Label><Select value={periodo} onValueChange={setPeriodo}><SelectTrigger aria-label="Semestre"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{semestres.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Perfil</Label><Select value={perfil} onValueChange={setPerfil}><SelectTrigger aria-label="Perfil"><SelectValue /></SelectTrigger><SelectContent>{PERFIS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <div className="space-y-1"><Label htmlFor="arquivo-aval">Arquivo de avaliações</Label><Input id="arquivo-aval" type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></div>
    {file && <>
      <h3 className="font-semibold">{file.name} · {linhas.length} registros</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{campos.map(c => <div key={c} className="min-w-0 space-y-1"><Label className="break-words">{c}</Label>
        <Select value={mapping[c] || '__none__'} onValueChange={v => setMapping(m => ({ ...m, [c]: v === '__none__' ? '' : v }))}><SelectTrigger aria-label={`Coluna ${c}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none__">— Nenhum —</SelectItem>{columns.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select></div>)}</div>
      <Button onClick={importar} disabled={busy || !periodo || !linhas.length} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? 'Importando...' : 'Importar Avaliações'}</Button>
    </>}
  </div>;
}
