import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { COLUNAS_SUGESTOES, converterSugestoes, lerArquivoSugestoes } from '@/lib/importar-sugestoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PERFIS = [{ value: 'aluno', label: 'Aluno' }, { value: 'professor', label: 'Professor' }, { value: 'colaborador', label: 'Colaborador' }, { value: 'coordenador', label: 'Coordenador' }] as const;

export default function SugestoesImportacao({ onImported }: { onImported?: () => void }) {
  const [ambientes, setAmbientes] = useState<Tables<'ambientes_avaliacao'>[]>([]);
  const [ambiente, setAmbiente] = useState('');
  const [perfil, setPerfil] = useState<Enums<'perfil_avaliacao'>>('aluno');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const valid = converterSugestoes(rows, mapping);

  useEffect(() => {
    supabase.from('ambientes_avaliacao').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) toast.error('Erro ao carregar ambientes');
      else setAmbientes(data || []);
    });
  }, []);

  const upload = async (f: File | undefined) => {
    setFile(null); setRows([]); setColumns([]); setMapping({});
    if (!f) return;
    try {
      const parsed = await lerArquivoSugestoes(f);
      if (!parsed.rows.length) throw new Error('Arquivo vazio');
      setFile(f); setRows(parsed.rows); setColumns(parsed.columns.filter(Boolean)); setMapping(parsed.mapping);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível ler o arquivo'); }
  };

  const importar = async () => {
    if (!file || !ambiente || !valid.length || !mapping.SUGESTAO) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('importar_sugestoes', { p_ambiente: ambiente, p_perfil: perfil, p_arquivo: file.name, p_linhas: valid });
      if (error) throw error;
      toast.success(`${valid.length} sugestões importadas com sucesso!`);
      setFile(null); setRows([]); setColumns([]); setMapping({}); onImported?.();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao importar sugestões'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label>Ambiente de Avaliação</Label><Select value={ambiente} onValueChange={setAmbiente} disabled={busy}><SelectTrigger aria-label="Ambiente das sugestões"><SelectValue placeholder="Selecione o ambiente" /></SelectTrigger><SelectContent>{ambientes.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Perfil</Label><Select value={perfil} onValueChange={v => { const p = PERFIS.find(p => p.value === v); if (p) setPerfil(p.value); }} disabled={busy}><SelectTrigger aria-label="Perfil das sugestões"><SelectValue /></SelectTrigger><SelectContent>{PERFIS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <div className="space-y-1"><Label htmlFor="arquivo-sugestoes">Arquivo de sugestões</Label><Input id="arquivo-sugestoes" type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></div>
    {file && <>
      <h3 className="font-semibold text-foreground">{file.name} · {valid.length} sugestões{rows.length !== valid.length ? ` · ${rows.length - valid.length} linhas sem sugestão` : ''}</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{COLUNAS_SUGESTOES.map(c => <div key={c} className="min-w-0 space-y-1"><Label className="break-words">{c}</Label><Select value={mapping[c] || '__none__'} onValueChange={v => setMapping(m => ({ ...m, [c]: v === '__none__' ? '' : v }))} disabled={busy}><SelectTrigger aria-label={`Coluna ${c}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none__">— Nenhum —</SelectItem>{columns.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select></div>)}</div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Curso</TableHead><TableHead>Dimensão / Área</TableHead><TableHead>Questão</TableHead><TableHead>Sugestão</TableHead></TableRow></TableHeader><TableBody>{valid.slice(0, 5).map((r, i) => <TableRow key={i}><TableCell>{r.nome_curso || '—'}</TableCell><TableCell>{r.dimensao}<br />{r.area}</TableCell><TableCell className="min-w-48">{r.texto_questao}</TableCell><TableCell className="min-w-64 whitespace-pre-wrap">{r.sugestao}</TableCell></TableRow>)}</TableBody></Table></div>
      <Button onClick={importar} disabled={busy || !ambiente || !mapping.SUGESTAO || !valid.length} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? 'Importando...' : 'Importar Sugestões'}</Button>
    </>}
  </div>;
}