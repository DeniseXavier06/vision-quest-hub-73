import { describe, expect, it } from 'vitest';
import { areasParaAcao, selecionarDiscentes2026, type ResultadoDiscente } from './storytelling-discentes';

const linha = (patch: Partial<ResultadoDiscente> = {}): ResultadoDiscente => ({ semestre: '2026.2', nivel: 'Alunos', curso: 'Direito', dimensao: 'Curso', area: 'Ensino', professor: '', textoQuestao: 'Avaliação da aprendizagem', excelente: 0, bom: 0, atendeParcialmente: 1, regular: 0, muitoRuim: 0, naoSeAplica: 0, total: 1, media: 3.5, ...patch });
describe('história dos resultados discentes de 2026', () => {
  it('seleciona apenas o ano de 2026', () => {
    expect(selecionarDiscentes2026([linha(), linha({ semestre: '2025.2' }), linha({ semestre: '20260.2' })]).map(r => r.semestre)).toEqual(['2026.2']);
  });
  it('seleciona somente discentes presenciais e EAD', () => {
    expect(selecionarDiscentes2026([linha(), linha({ nivel: 'Alunos EAD' }), linha({ nivel: 'Professores' }), linha({ nivel: 'Colaboradores' })]).map(r => r.nivel)).toEqual(['Alunos', 'Alunos EAD']);
  });
  it.each([[3.5, 'Atende Parcialmente'], [2.5, 'Regular'], [1.5, 'Muito Ruim']])('inclui área com média %s e conceito %s', (media, esperado) => {
    expect(areasParaAcao([linha({ media: Number(media) })])[0]?.conceito).toBe(esperado);
  });
  it('não inclui áreas Bom ou Excelente nas prioridades', () => {
    expect(areasParaAcao([linha({ media: 4.5 }), linha({ area: 'Biblioteca', media: 4.9 })])).toEqual([]);
  });
  it('não deixa um curso com média alta ocultar a prioridade de outro', () => {
    const resultado = areasParaAcao([linha({ media: 2.5 }), linha({ curso: 'Farmácia', media: 5 })]);
    expect(resultado.map(r => [r.curso, r.media, r.evidencias[0]?.media])).toEqual([['Direito', 2.5, 2.5]]);
  });
});import { compararAnos, selecionarDiscentes } from './storytelling-discentes';
describe('triênio discente', () => {
  it('seleciona 2024, 2025 e 2026', () => {
    expect(selecionarDiscentes([linha({ semestre: '2024.2' }), linha({ semestre: '2023.2' }), linha()], ['2024', '2025', '2026']).map(r => r.semestre)).toEqual(['2024.2', '2026.2']);
  });
  it('compara a média de cada ano por curso', () => {
    expect(compararAnos([linha({ semestre: '2024.2', media: 4 }), linha({ media: 3 })], 'curso', ['2024', '2025', '2026'])).toEqual([{ nome: 'Direito', '2024': 4, '2025': null, '2026': 3 }]);
  });
});
import { eixoDaArea } from './storytelling-discentes';
describe('eixos discentes', () => {
  it.each([['Imagem do curso', 'Eixo 1 - Desenvolvimento Institucional'], ['Atendimento do coordenador aos alunos', 'Eixo 2 - Políticas Acadêmicas'], ['Avaliação da aprendizagem', 'Eixo 3 - Políticas de Gestão'], ['Ambiente Virtual Aprendizagem', 'Eixo 4 - Infraestrutura Física'], ['Sala de aula', 'Eixo 4 - Infraestrutura Física']])('%s → %s', (a, e) => expect(eixoDaArea(a)).toBe(e));
});
import { comEixo, resumirGrupos } from './storytelling-discentes';
import { recorteCurso } from './storytelling-discentes';
describe('expansão de cursos', () => {
  const dados = [linha({ dimensao: 'Curso', area: 'Biblioteca', media: 3 }), linha({ dimensao: 'Professor', area: 'Ensino', media: 4 }), linha({ curso: 'Farmácia', dimensao: 'Curso', area: 'Biblioteca', media: 5 })];
  it('expande apenas as dimensões do curso clicado com suas médias', () => {
    expect(resumirGrupos(recorteCurso(dados, 'Direito', null), 'dimensao').map(d => [d.nome, d.media])).toEqual([['Professor', 4], ['Curso', 3]]);
  });
  it('expande apenas as áreas da dimensão do curso clicado', () => {
    expect(resumirGrupos(recorteCurso(dados, 'Direito', 'Curso'), 'area').map(d => [d.nome, d.media])).toEqual([['Biblioteca', 3]]);
  });
  it('preserva o comparativo por ano no detalhe', () => {
    expect(compararAnos(recorteCurso([...dados, linha({ semestre: '2024.2', area: 'Biblioteca', media: 2 })], 'Direito', 'Curso'), 'area', ['2024', '2025', '2026'])).toEqual([{ nome: 'Biblioteca', '2024': 2, '2025': null, '2026': 3 }]);
  });
});
describe('ordem do gráfico por eixo', () => {
  it('ordena os eixos em sequência, não pela média', () => {
    const linhas = comEixo([linha({ area: 'Polo', media: 5 }), linha({ area: 'Imagem do Curso', media: 3 }), linha({ area: 'Avaliação da Aprendizagem', media: 3.5 })]);
    expect(resumirGrupos(linhas, 'eixo').map(g => g.nome)).toEqual(['Eixo 1 - Desenvolvimento Institucional', 'Eixo 3 - Políticas de Gestão', 'Eixo 4 - Infraestrutura Física']);
  });
  it('mantém a ordem decrescente de média nos demais gráficos', () => {
    expect(resumirGrupos([linha({ area: 'Polo', media: 3 }), linha({ area: 'Laboratórios', media: 4.5 })], 'area').map(g => g.nome)).toEqual(['Laboratórios', 'Polo']);
  });
});
import { cursosPorQuestao } from './storytelling-discentes';
describe('cursos impactados por questão', () => {
  it('conta cursos distintos com a questão em conceito prioritário', () => {
    const r = cursosPorQuestao(areasParaAcao([linha({ media: 3 }), linha({ curso: 'Farmácia', media: 2.5 }), linha({ curso: 'Farmácia', area: 'Biblioteca', media: 3.5 })]));
    expect(r.map(q => [q.questao, q.quantidade, q.cursos.map(c => c.curso)])).toEqual([['Avaliação da aprendizagem', 2, ['Farmácia', 'Direito']]]);
  });
});
