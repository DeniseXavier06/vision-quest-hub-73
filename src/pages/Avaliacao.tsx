import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Star, ChevronRight, ChevronLeft, LogIn, ClipboardList, BarChart3 } from 'lucide-react';

type Ambiente = {
  id: string; nome: string; nivel: string; data_inicio: string; data_fim: string; prorrogado_ate: string | null; semestre_id: string;
};
type Dimensao = { id: string; nome: string; descricao: string | null; ordem: number };
type AreaAvaliacao = { id: string; nome: string; descricao: string | null; ordem: number; dimensao_id: string };
type Questao = { id: string; texto: string; ordem: number; dimensao_id: string; area_id: string | null };
type Sessao = { id: string; token: string };

const scaleLabels = ['', 'Muito Ruim', 'Regular', 'Atende Parcialmente', 'Bom', 'Excelente'];
const scaleOrder = [5, 4, 3, 2, 1];

const Avaliacao = () => {
  const [step, setStep] = useState<'login' | 'dimensoes' | 'avaliando' | 'concluido'>('login');
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [perfil, setPerfil] = useState('');

  const [dimensoes, setDimensoes] = useState<Dimensao[]>([]);
  const [areas, setAreas] = useState<AreaAvaliacao[]>([]);
  const [allQuestoes, setAllQuestoes] = useState<Questao[]>([]);

  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [completedDimensoes, setCompletedDimensoes] = useState<string[]>([]);
  const [activeDimId, setActiveDimId] = useState<string | null>(null);

  // Load active ambientes
  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('ambientes_avaliacao')
        .select('*')
        .eq('ativo', true)
        .lte('data_inicio', today)
        .order('nome');
      if (data) {
        const filtered = data.filter(a => {
          const fim = a.prorrogado_ate || a.data_fim;
          return fim >= today;
        });
        setAmbientes(filtered);
      }
    };
    load();
  }, []);

  const handleLogin = async () => {
    if (!selectedAmbiente || !matricula.trim() || !senha.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const { data: avaliador } = await supabase
      .from('avaliadores_sessao')
      .select('*')
      .eq('ambiente_id', selectedAmbiente)
      .eq('matricula', matricula.trim())
      .maybeSingle();

    if (!avaliador) {
      toast({ title: 'Matrícula não encontrada neste ambiente', variant: 'destructive' });
      return;
    }

    const senhaEsperada = (avaliador.cpf || '').replace(/\s/g, '');
    if (senha.replace(/[\s.\-]/g, '') !== senhaEsperada.replace(/[\s.\-]/g, '')) {
      toast({ title: 'Senha incorreta', description: 'A senha é o seu CPF.', variant: 'destructive' });
      return;
    }

    if (avaliador.completado) {
      toast({ title: 'Você já respondeu esta avaliação', variant: 'destructive' });
      return;
    }

    setSessao({ id: avaliador.id, token: avaliador.token });
    setNome(avaliador.nome);
    setCurso(avaliador.curso);
    setPerfil(avaliador.perfil);

    // Load dimensões linked to this ambiente
    const { data: ambDims } = await supabase.from('ambiente_dimensoes').select('dimensao_id').eq('ambiente_id', selectedAmbiente);
    if (ambDims && ambDims.length > 0) {
      const dimIds = ambDims.map(d => d.dimensao_id);
      const [{ data: dims }, { data: areasData }, { data: questoesData }] = await Promise.all([
        supabase.from('dimensoes_avaliacao').select('*').in('id', dimIds).eq('ativo', true).order('ordem'),
        supabase.from('areas_avaliacao').select('*').in('dimensao_id', dimIds).eq('ativo', true).order('ordem'),
        supabase.from('questoes_avaliacao').select('*').in('dimensao_id', dimIds).eq('ativo', true).order('ordem'),
      ]);
      if (dims) setDimensoes(dims);
      if (areasData) setAreas(areasData);
      if (questoesData) setAllQuestoes(questoesData);
    }

    setStep('dimensoes');
  };

  const handleStartDimensao = (dimId: string) => {
    setActiveDimId(dimId);
    setCurrentDimIndex(0);
    setStep('avaliando');
  };

  const calcMedia = (notas: number[]) => notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const getConceito = (media: number) => {
    if (media >= 4.5) return 'Excelente';
    if (media >= 3.5) return 'Bom';
    if (media >= 2.5) return 'Atende Parcialmente';
    if (media >= 1.5) return 'Regular';
    return 'Muito Ruim';
  };

  // Status helpers per dimension
  const getDimStatus = (dimId: string) => {
    const dimQuestoes = allQuestoes.filter(q => q.dimensao_id === dimId);
    if (dimQuestoes.length === 0) return 'sem_questoes';
    const respondidas = dimQuestoes.filter(q => respostas[q.id] !== undefined).length;
    if (respondidas === dimQuestoes.length) return 'avaliado';
    return 'nao_avaliado';
  };

  const getDimMedia = (dimId: string) => {
    const dimQuestoes = allQuestoes.filter(q => q.dimensao_id === dimId);
    const notas = dimQuestoes.map(q => respostas[q.id]).filter(n => n !== undefined) as number[];
    return notas.length > 0 ? calcMedia(notas) : null;
  };

  const allDimensoesAvaliadas = dimensoes.length > 0 && dimensoes.every(d => getDimStatus(d.id) === 'avaliado');

  const handleSubmit = async () => {
    if (!sessao) return;
    setSaving(true);
    try {
      const rows = Object.entries(respostas).map(([questao_id, nota]) => {
        const q = allQuestoes.find(qq => qq.id === questao_id)!;
        return {
          sessao_id: sessao.id,
          ambiente_id: selectedAmbiente,
          dimensao_id: q.dimensao_id,
          questao_id,
          nota,
          observacao: observacoes[questao_id] || '',
        };
      });

      const { error } = await supabase.from('respostas_avaliacao').insert(rows);
      if (error) throw error;

      await supabase.from('avaliadores_sessao').update({ completado: true }).eq('id', sessao.id);
      setStep('concluido');
      toast({ title: 'Avaliação enviada com sucesso!' });
    } catch {
      toast({ title: 'Erro ao enviar avaliação', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Current dimension data for avaliando step
  const currentDimId = activeDimId;
  const currentDim = dimensoes.find(d => d.id === currentDimId);
  const currentAreas = useMemo(() => areas.filter(a => a.dimensao_id === currentDimId), [areas, currentDimId]);
  const currentQuestoes = useMemo(() => allQuestoes.filter(q => q.dimensao_id === currentDimId), [allQuestoes, currentDimId]);
  const allCurrentAnswered = currentQuestoes.every(q => respostas[q.id] !== undefined);
  const totalQuestoesAll = allQuestoes.length;
  const totalRespondidas = Object.keys(respostas).length;
  const progressPercent = totalQuestoesAll > 0 ? (totalRespondidas / totalQuestoesAll) * 100 : 0;

  // LOGIN
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Avaliação Institucional</CardTitle>
            <CardDescription>Identifique-se para iniciar a avaliação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ambiente de Avaliação *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedAmbiente} onChange={e => setSelectedAmbiente(e.target.value)}>
                <option value="">Selecione...</option>
                {ambientes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <Label>Matrícula *</Label>
              <Input placeholder="Digite sua matrícula" value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input type="password" placeholder="Digite seu CPF" value={senha} onChange={e => setSenha(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">A senha é o seu CPF (com ou sem pontuação)</p>
            </div>
            <Button className="w-full" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" /> Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // DIMENSÕES - todas obrigatórias, com status e média
  if (step === 'dimensoes') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Dimensões da Avaliação</CardTitle>
            <CardDescription>
              Olá, {nome}! Você deve avaliar todas as dimensões abaixo.
            </CardDescription>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso geral</span>
                <span>{totalRespondidas}/{totalQuestoesAll} questões</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensoes.map(d => {
              const status = getDimStatus(d.id);
              const media = getDimMedia(d.id);
              const dimQuestoes = allQuestoes.filter(q => q.dimensao_id === d.id);
              const respondidas = dimQuestoes.filter(q => respostas[q.id] !== undefined).length;
              const isAvaliado = status === 'avaliado';

              return (
                <div
                  key={d.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${isAvaliado ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border hover:bg-muted hover:border-primary/50'}`}
                  onClick={() => handleStartDimensao(d.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {d.nome}
                        {isAvaliado ? (
                          <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">Avaliado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Não Avaliado</Badge>
                        )}
                      </div>
                      {d.descricao && <div className="text-xs text-muted-foreground mt-0.5">{d.descricao}</div>}
                      <div className="text-xs text-muted-foreground mt-1">
                        {respondidas}/{dimQuestoes.length} questões respondidas
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {media !== null && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BarChart3 className="h-3 w-3" /> Média
                          </div>
                          <div className="text-lg font-bold text-primary">{media.toFixed(2)}</div>
                          <div className="text-[10px] text-muted-foreground">{getConceito(media)}</div>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}

            {dimensoes.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma dimensão configurada para este ambiente.</p>}

            {allDimensoesAvaliadas && (
              <Button className="w-full mt-4" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar Avaliação'} <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}

            {!allDimensoesAvaliadas && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Avalie todas as dimensões para poder enviar a avaliação.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // CONCLUÍDO
  if (step === 'concluido') {
    const allNotas = Object.values(respostas);
    const media = calcMedia(allNotas);
    const conceito = getConceito(media);
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Avaliação Concluída!</CardTitle>
            <CardDescription>Obrigado por participar da avaliação institucional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Sua média geral</div>
              <div className="text-3xl font-bold text-primary">{media.toFixed(2)}</div>
              <Badge variant="secondary" className="mt-1">{conceito}</Badge>
            </div>
            <div className="space-y-2">
              {dimensoes.map(d => {
                const dimMedia = getDimMedia(d.id);
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span>{d.nome}</span>
                    <span className="font-medium text-primary">{dimMedia?.toFixed(2) ?? '-'}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              {totalRespondidas} questões respondidas em {dimensoes.length} dimensão(ões)
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FORMULÁRIO DE AVALIAÇÃO
  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso: {totalRespondidas}/{totalQuestoesAll}</span>
              <span className="text-sm text-muted-foreground">{currentDim?.nome}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Current Dimension */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentDim?.nome}</CardTitle>
            {currentDim?.descricao && <CardDescription>{currentDim.descricao}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentAreas.length > 0 ? currentAreas.map((area) => {
              const areaQuestoes = currentQuestoes.filter(q => q.area_id === area.id);
              if (areaQuestoes.length === 0) return null;
              return (
                <div key={area.id} className="space-y-4">
                  <div className="border-l-4 border-primary pl-3">
                    <h4 className="text-sm font-semibold text-foreground">{area.nome}</h4>
                    {area.descricao && <p className="text-xs text-muted-foreground">{area.descricao}</p>}
                  </div>
                  {areaQuestoes.map((q, qi) => (
                    <div key={q.id} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="text-sm font-medium">{qi + 1}. {q.texto}</div>
                      <div className="flex gap-1">
                       {scaleOrder.map(nota => (
                          <button
                            key={nota}
                            onClick={() => setRespostas(prev => ({ ...prev, [q.id]: nota }))}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${respostas[q.id] === nota ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'}`}
                          >
                            <Star className={`h-4 w-4 ${respostas[q.id] === nota ? 'fill-primary text-primary' : ''}`} />
                            {scaleLabels[nota]}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Observação (opcional)"
                        value={observacoes[q.id] || ''}
                        onChange={e => setObservacoes(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="mt-1 text-xs"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              );
            }) : currentQuestoes.map((q, qi) => (
              <div key={q.id} className="space-y-2 pb-4 border-b last:border-0">
                <div className="text-sm font-medium">{qi + 1}. {q.texto}</div>
                <div className="flex gap-1">
                  {scaleOrder.map(nota => (
                    <button
                      key={nota}
                      onClick={() => setRespostas(prev => ({ ...prev, [q.id]: nota }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${respostas[q.id] === nota ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'}`}
                    >
                      <Star className={`h-4 w-4 ${respostas[q.id] === nota ? 'fill-primary text-primary' : ''}`} />
                      {scaleLabels[nota]}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Observação (opcional)"
                  value={observacoes[q.id] || ''}
                  onChange={e => setObservacoes(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="mt-1 text-xs"
                  rows={2}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resumo por dimensão */}
        {allCurrentAnswered && currentQuestoes.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Média desta dimensão:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {calcMedia(currentQuestoes.map(q => respostas[q.id])).toFixed(2)}
                  </span>
                  <Badge variant="secondary">
                    {getConceito(calcMedia(currentQuestoes.map(q => respostas[q.id])))}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setStep('dimensoes');
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar às Dimensões
          </Button>
          <Button onClick={() => {
            if (allCurrentAnswered && currentDimId) {
              setCompletedDimensoes(prev => prev.includes(currentDimId) ? prev : [...prev, currentDimId]);
            }
            setStep('dimensoes');
            if (allCurrentAnswered) {
              toast({ title: 'Dimensão concluída!', description: 'Selecione outra dimensão para continuar.' });
            }
          }} disabled={!allCurrentAnswered}>
            Concluir Dimensão <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Avaliacao;
