import { describe, expect, it } from 'vitest';
import { COLUNAS_SUGESTOES, converterSugestoes } from './importar-sugestoes';

describe('Importação de sugestões', () => {
  it('preserva as 13 colunas, inclusive os códigos e textos de avaliação', () => {
    const row = Object.fromEntries(COLUNAS_SUGESTOES.map(c => [c, c === 'CODIGO_TURMA' ? 'ADM2N262' : c === 'SUGESTAO' ? 'Mais livros, por favor; obrigada.' : c]));
    const [result] = converterSugestoes([row], {});
    expect(Object.keys(result)).toHaveLength(13);
    expect(result.codigo_turma).toBe('ADM2N262');
    expect(result.sugestao).toBe('Mais livros, por favor; obrigada.');
    expect(result.coordenador_avaliado).toBe('COORDENADOR_AVALIADO');
  });
  it('permite campos vazios sem importar sugestões em branco', () => {
    const result = converterSugestoes([{ SUGESTAO: 'Biblioteca aberta por mais tempo' }, { SUGESTAO: ' ' }], {});
    expect(result).toHaveLength(1);
    expect(result[0].professor_avaliado).toBe('');
    expect(result[0].nome_curso).toBe('');
  });
  it('usa o mapeamento selecionado sem misturar colunas', () => {
    expect(converterSugestoes([{ Comentario: 'Melhorar o laboratório', Curso: 'Farmácia' }], { SUGESTAO: 'Comentario', NOME_CURSO: 'Curso' })[0]).toMatchObject({ nome_curso: 'Farmácia', sugestao: 'Melhorar o laboratório' });
  });
});