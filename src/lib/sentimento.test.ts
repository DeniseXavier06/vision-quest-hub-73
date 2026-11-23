import { describe, it, expect } from 'vitest';
import { classificarSentimento, resumoSentimentos } from './sentimento';

describe('sentimento', () => {
  it('elogio é positivo', () => expect(classificarSentimento('Ótimos professores, parabéns!')).toBe('positivo'));
  it('reclamação é negativa', () => expect(classificarSentimento('A internet é muito lenta e o laboratório está quebrado')).toBe('negativo'));
  it('negação inverte elogio', () => expect(classificarSentimento('O atendimento não é bom')).toBe('negativo'));
  it('texto sem opinião é neutro', () => expect(classificarSentimento('Gostaria de mais aulas práticas')).toBe('neutro'));
  it('resume contagens', () => expect(resumoSentimentos(['excelente', 'ruim', 'ok'])).toEqual({ positivo: 1, negativo: 1, neutro: 1 }));
});
