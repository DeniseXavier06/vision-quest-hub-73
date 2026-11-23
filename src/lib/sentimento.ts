export type Sentimento = 'positivo' | 'negativo' | 'neutro';

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const POS = ['otimo','otima','excelente','bom','boa','bons','boas','gosto','gostei','adoro','parabens','satisfeito','satisfeita','eficiente','atencioso','atenciosa','maravilhos','incrivel','perfeito','perfeita','qualidade','obrigad','elogio','recomendo','melhor','ajuda','dedicad','competente','claro','clara','organizad'];
const NEG = ['ruim','pessimo','pessima','horrivel','demora','demorad','atraso','atrasad','falta','problema','dificil','dificuldade','nao funciona','insatisfeit','precari','sujo','suja','quebrad','lento','lenta','reclama','descaso','desorganiza','pouco','pouca','faltou','nunca','caro','cara','barulho','calor','pior','fraco','fraca','confus','desrespeit','abandon','deficien'];
const NEGADORES = ['nao','nunca','nem','sem'];

/** Classifica o tom de um texto contando palavras positivas e negativas (com negação simples). */
export function classificarSentimento(texto: string): Sentimento {
  const palavras = norm(texto).split(/[^a-z]+/).filter(Boolean);
  const t = ' ' + palavras.join(' ') + ' ';
  let score = 0;
  palavras.forEach((w, i) => {
    const negado = [palavras[i - 1], palavras[i - 2]].some(p => NEGADORES.includes(p ?? ''));
    if (POS.some(p => w.startsWith(p))) score += negado ? -1 : 1;
    else if (NEG.some(n => !n.includes(' ') && w.startsWith(n))) score += negado ? 0 : -1;
  });
  NEG.filter(n => n.includes(' ')).forEach(n => { if (t.includes(` ${n} `)) score -= 1; });
  return score > 0 ? 'positivo' : score < 0 ? 'negativo' : 'neutro';
}

export function resumoSentimentos(textos: string[]) {
  const r = { positivo: 0, negativo: 0, neutro: 0 };
  textos.forEach(t => { r[classificarSentimento(t)]++; });
  return r;
}
