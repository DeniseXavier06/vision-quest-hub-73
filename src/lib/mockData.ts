export interface Eixo {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
  totalAcoes: number;
  acoesConcluidas: number;
  acoesEmAndamento: number;
  acoesNaoIniciadas: number;
  percentualMedio: number;
}

export interface Acao {
  id: string;
  nome: string;
  eixo: string;
  meta: string;
  responsavel: string;
  status: 'nao_iniciada' | 'em_andamento' | 'concluida';
  percentualProgresso: number;
  prazo: string;
  diasRestantes: number;
}

export interface Reuniao {
  id: string;
  titulo: string;
  dataHora: string;
  tipo: string;
  status: string;
  local: string;
}

export interface Avaliacao {
  id: string;
  tipo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  responsavel: string;
}

export const eixosData: Eixo[] = [
  { id: '1', nome: 'Planejamento e Avaliação', descricao: 'Divulgação de resultados e perfil acadêmico', ordem: 1, totalAcoes: 8, acoesConcluidas: 3, acoesEmAndamento: 3, acoesNaoIniciadas: 2, percentualMedio: 45 },
  { id: '2', nome: 'Políticas Acadêmicas', descricao: 'Atendimento aos alunos e gestão acadêmica', ordem: 2, totalAcoes: 6, acoesConcluidas: 2, acoesEmAndamento: 2, acoesNaoIniciadas: 2, percentualMedio: 38 },
  { id: '3', nome: 'Políticas de Gestão', descricao: 'Avaliação da aprendizagem e ambiente virtual', ordem: 3, totalAcoes: 5, acoesConcluidas: 1, acoesEmAndamento: 3, acoesNaoIniciadas: 1, percentualMedio: 32 },
  { id: '4', nome: 'Infraestrutura', descricao: 'Laboratórios e modernização', ordem: 4, totalAcoes: 7, acoesConcluidas: 4, acoesEmAndamento: 2, acoesNaoIniciadas: 1, percentualMedio: 62 },
  { id: '5', nome: 'Valorização Profissional', descricao: 'Desenvolvimento e reconhecimento', ordem: 5, totalAcoes: 4, acoesConcluidas: 1, acoesEmAndamento: 2, acoesNaoIniciadas: 1, percentualMedio: 30 },
  { id: '6', nome: 'Imagem Institucional', descricao: 'Reforço da imagem e engajamento', ordem: 6, totalAcoes: 5, acoesConcluidas: 2, acoesEmAndamento: 1, acoesNaoIniciadas: 2, percentualMedio: 40 },
];

export const acoesData: Acao[] = [
  { id: '1', nome: 'Divulgar resultados do Perfil Acadêmico', eixo: 'Planejamento e Avaliação', meta: 'Divulgar resultados da CPA', responsavel: 'Maria Silva', status: 'em_andamento', percentualProgresso: 60, prazo: '2026-05-15', diasRestantes: 36 },
  { id: '2', nome: 'Aplicar questionário socioeconômico', eixo: 'Planejamento e Avaliação', meta: 'Levantar perfil socioeconômico', responsavel: 'João Santos', status: 'nao_iniciada', percentualProgresso: 0, prazo: '2026-06-01', diasRestantes: 53 },
  { id: '3', nome: 'Organizar focus group com discentes', eixo: 'Políticas Acadêmicas', meta: 'Avaliar atendimento', responsavel: 'Ana Costa', status: 'em_andamento', percentualProgresso: 40, prazo: '2026-04-30', diasRestantes: 21 },
  { id: '4', nome: 'Atualizar ambiente virtual de aprendizagem', eixo: 'Políticas de Gestão', meta: 'Modernizar AVA', responsavel: 'Carlos Lima', status: 'concluida', percentualProgresso: 100, prazo: '2026-04-01', diasRestantes: -8 },
  { id: '5', nome: 'Inventário de equipamentos de laboratório', eixo: 'Infraestrutura', meta: 'Modernizar laboratórios', responsavel: 'Maria Silva', status: 'em_andamento', percentualProgresso: 75, prazo: '2026-04-20', diasRestantes: 11 },
  { id: '6', nome: 'Programa de capacitação docente', eixo: 'Valorização Profissional', meta: 'Desenvolvimento docente', responsavel: 'Pedro Oliveira', status: 'nao_iniciada', percentualProgresso: 0, prazo: '2026-07-01', diasRestantes: 83 },
  { id: '7', nome: 'Campanha nas redes sociais', eixo: 'Imagem Institucional', meta: 'Reforço de imagem', responsavel: 'Ana Costa', status: 'concluida', percentualProgresso: 100, prazo: '2026-03-15', diasRestantes: -25 },
  { id: '8', nome: 'Relatório de avaliação quantitativa', eixo: 'Planejamento e Avaliação', meta: 'Divulgar resultados da CPA', responsavel: 'João Santos', status: 'em_andamento', percentualProgresso: 30, prazo: '2026-05-30', diasRestantes: 51 },
];

export const reunioesData: Reuniao[] = [
  { id: '1', titulo: 'Reunião Plenária CPA', dataHora: '2026-04-14T14:00:00', tipo: 'plenaria', status: 'agendada', local: 'Sala de Reuniões A' },
  { id: '2', titulo: 'Alinhamento Coordenadores', dataHora: '2026-04-18T10:00:00', tipo: 'coordenadores', status: 'agendada', local: 'Google Meet' },
  { id: '3', titulo: 'Revisão de Resultados', dataHora: '2026-04-25T15:00:00', tipo: 'gestores', status: 'agendada', local: 'Auditório' },
];

export const avaliacoesData: Avaliacao[] = [
  { id: '1', tipo: 'Perfil Acadêmico', descricao: 'Levantamento do perfil dos discentes', dataInicio: '2026-03-01', dataFim: '2026-04-30', status: 'em_execucao', responsavel: 'Maria Silva' },
  { id: '2', tipo: 'Avaliação Quantitativa', descricao: 'Questionário de satisfação geral', dataInicio: '2026-05-01', dataFim: '2026-06-15', status: 'planejado', responsavel: 'João Santos' },
  { id: '3', tipo: 'Avaliação Qualitativa', descricao: 'Focus groups e entrevistas', dataInicio: '2026-06-01', dataFim: '2026-07-31', status: 'planejado', responsavel: 'Ana Costa' },
  { id: '4', tipo: 'Comunidade Externa', descricao: 'Pesquisa com egressos e empregadores', dataInicio: '2026-08-01', dataFim: '2026-09-30', status: 'planejado', responsavel: 'Pedro Oliveira' },
];

export const statusLabels: Record<string, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  planejado: 'Planejado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};
