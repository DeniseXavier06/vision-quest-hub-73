import { conceito, mediaHierarquica, mediaQuestoes, totalRespostas, type LinhaResultado } from './medidas';

export interface ResultadoDiscente extends LinhaResultado { professor: string; eixo?: string }
export const CONCEITOS_PRIORITARIOS = ['Atende Parcialmente', 'Regular', 'Muito Ruim'];

export function selecionarDiscentes2026(rows: ResultadoDiscente[]) {
  return rows.filter(r => /^2026(?:[.\-/]|$)/.test(r.semestre.trim()) && /aluno|discente/i.test(r.nivel));
}

export function resumirGrupos(rows: ResultadoDiscente[], campo: 'curso' | 'dimensao' | 'area' | 'professor' | 'eixo') {
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
  }).sort((a, b) => (campo === 'eixo' ? ordemEixo(a.nome) - ordemEixo(b.nome) : b.media - a.media) || a.nome.localeCompare(b.nome));
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
export const ANOS_TRIENIO = ['2024', '2025', '2026'];
export function selecionarDiscentes(rows: ResultadoDiscente[], anos: string[]) {
  return rows.filter(r => anos.some(a => new RegExp(`^${a}(?:[.\\-/]|$)`).test(r.semestre.trim())) && /aluno|discente/i.test(r.nivel));
}
export function compararAnos(rows: ResultadoDiscente[], campo: 'curso' | 'dimensao' | 'area' | 'professor' | 'eixo', anos: string[]) {
  return resumirGrupos(rows, campo).map(({ nome }) => {
    const o: Record<string, string | number | null> = { nome };
    anos.forEach(a => {
      const g = rows.filter(r => r[campo]?.trim() === nome && r.semestre.trim().startsWith(a));
      o[a] = g.length ? Number(mediaHierarquica(g).toFixed(2)) : null;
    });
    return o;
  });
}
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bde\b/g, '').replace(/\s+/g, ' ').trim();
export const EIXOS: [string, string[]][] = [
  ['Eixo 1 - Desenvolvimento Institucional', ['Imagem do Curso', 'Imagem da Instituição']],
  ['Eixo 2 - Políticas Acadêmicas', ['Estratégias de ensino', 'O Envolvimento do Aluno', 'Atendimento do Coordenador aos alunos', 'Atendimento aos alunos']],
  ['Eixo 3 - Políticas de Gestão', ['Organização didático-pedagógica', 'Avaliação da Aprendizagem']],
  ['Eixo 4 - Infraestrutura Física', ['Polo', 'Laboratórios', 'Ambiente Virtual de Aprendizagem', 'Biblioteca', 'Sala de Aula']],
];
export const ordemEixo = (nome: string) => { const i = EIXOS.findIndex(([e]) => e === nome); return i < 0 ? EIXOS.length : i; };
export function eixoDaArea(area: string) {
  const a = norm(area || '');
  return EIXOS.find(([, areas]) => areas.some(x => norm(x) === a))?.[0] || '';
}
export const comEixo = (rows: ResultadoDiscente[]) => rows.map(r => ({ ...r, eixo: eixoDaArea(r.area) }));

export function recorteCurso(rows: ResultadoDiscente[], curso: string | null, dimensao: string | null) {
  return rows.filter(r => (!curso || r.curso.trim() === curso) && (!dimensao || r.dimensao.trim() === dimensao));
}
