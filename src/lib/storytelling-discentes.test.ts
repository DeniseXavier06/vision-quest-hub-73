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
});