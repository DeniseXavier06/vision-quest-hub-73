import { conceito, mediaHierarquica, mediaQuestoes, totalRespostas, type LinhaResultado } from './medidas';

export interface ResultadoDiscente extends LinhaResultado { professor: string }
export const CONCEITOS_PRIORITARIOS = ['Atende Parcialmente', 'Regular', 'Muito Ruim'];

export function selecionarDiscentes2026(rows: ResultadoDiscente[]) {
  return rows.filter(r => /^2026(?:[.\-/]|$)/.test(r.semestre.trim()) && /aluno|discente/i.test(r.nivel));
}

export function resumirGrupos(rows: ResultadoDiscente[], campo: 'curso' | 'dimensao' | 'area' | 'professor') {
  const grupos = new Map<string, ResultadoDiscente[]>();
  rows.forEach(r => {
    const nome = r[campo]?.trim();
    if (!nome) return;
    const grupo = grupos.get(nome) || [];
    grupo.push(r);
    grupos.set(nome, grupo);
  });
  return [...grupos].map(([nome, grupo]) => {
    const media = mediaHierarquica(grupo);
    return { nome, media, conceito: conceito(media), respostas: totalRespostas(grupo) };
  }).sort((a, b) => b.media - a.media || a.nome.localeCompare(b.nome));
}

export function areasParaAcao(rows: ResultadoDiscente[]) {
  const grupos = new Map<string, ResultadoDiscente[]>();
  rows.forEach(r => {
    const chave = JSON.stringify([r.nivel, r.curso, r.dimensao, r.area]);
    const grupo = grupos.get(chave) || [];
    grupo.push(r);
    grupos.set(chave, grupo);
  });
  return [...grupos.values()].flatMap(grupo => {
    const media = mediaHierarquica(grupo);
    const classificacao = conceito(media);
    if (!CONCEITOS_PRIORITARIOS.includes(classificacao)) return [];
    const primeira = grupo[0];
    if (!primeira) return [];
    const questoes = new Map<string, ResultadoDiscente[]>();
    grupo.forEach(r => {
      const linhas = questoes.get(r.textoQuestao) || [];
      linhas.push(r);
      questoes.set(r.textoQuestao, linhas);
    });
    const evidencias = [...questoes].map(([questao, linhas]) => ({ questao, media: mediaQuestoes(linhas) }))
      .sort((a, b) => a.media - b.media);
    return [{ nivel: primeira.nivel, curso: primeira.curso, dimensao: primeira.dimensao,
      area: primeira.area, media, conceito: classificacao, evidencias, respostas: totalRespostas(grupo) }];
  }).sort((a, b) => a.media - b.media || a.curso.localeCompare(b.curso));
}