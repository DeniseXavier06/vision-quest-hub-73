// Modelo semântico único da CPA: medidas definidas uma vez e reutilizadas em todas as telas.

export interface LinhaResultado {
  semestre: string;
  nivel: string;
  curso: string;
  dimensao: string;
  area: string;
  textoQuestao: string;
  excelente: number;
  bom: number;
  atendeParcialmente: number;
  regular: number;
  muitoRuim: number;
  naoSeAplica: number;
  total: number;
  media: number;
}

export const CONCEITO_CORES: Record<string, string> = {
  Excelente: '#34a853',
  Bom: '#4285f4',
  'Atende Parcialmente': '#fbbc04',
  Regular: '#ea4335',
  'Muito Ruim': '#c5221f',
  '--': '#1a237e',
};

/** Conceito CPA: Excelente 4.7–5 | Bom 4.1–4.6 | AP 3.1–4 | Regular 2.2–3 | Muito Ruim < 2.2 */
export function conceito(media: number): string {
  if (!media || media <= 0) return '--';
  if (media >= 4.7) return 'Excelente';
  if (media >= 4.1) return 'Bom';
  if (media >= 3.1) return 'Atende Parcialmente';
  if (media >= 2.2) return 'Regular';
  return 'Muito Ruim';
}

export const corMedia = (m: number) => CONCEITO_CORES[conceito(m)];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Média de Questão = média simples das linhas da questão. */
export function mediaQuestoes(rows: LinhaResultado[]): number {
  const v = rows.map((r) => Number(r.media)).filter((n) => !isNaN(n));
  return v.length ? round2(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

/** Média Hierárquica (igual ao Power BI): média das questões por área, depois média das áreas. */
export function mediaHierarquica(rows: LinhaResultado[]): number {
  const areas = new Map<string, LinhaResultado[]>();
  rows.forEach((r) => {
    if (!r.area) return;
    areas.set(r.area, [...(areas.get(r.area) || []), r]);
  });
  if (!areas.size) return mediaQuestoes(rows);
  const medias = [...areas.values()].map(mediaQuestoes);
  return round2(medias.reduce((a, b) => a + b, 0) / medias.length);
}

/** % Favorável = (Excelente + Bom) / respostas válidas. */
export function percFavoravel(rows: LinhaResultado[]): number {
  let fav = 0, tot = 0;
  rows.forEach((r) => {
    fav += (r.excelente || 0) + (r.bom || 0);
    tot += (r.excelente || 0) + (r.bom || 0) + (r.atendeParcialmente || 0) + (r.regular || 0) + (r.muitoRuim || 0);
  });
  return tot ? round2((fav / tot) * 100) : 0;
}

/** Total de Respostas = soma do total informado. */
export const totalRespostas = (rows: LinhaResultado[]) => rows.reduce((a, r) => a + (r.total || 0), 0);

export const CATALOGO_MEDIDAS = [
  { nome: 'Média Hierárquica', formula: 'MÉDIA( média das questões por Área )', uso: 'Média oficial de curso, dimensão e área' },
  { nome: 'Média de Questão', formula: 'MÉDIA( média das linhas da questão )', uso: 'Nível mais detalhado do drill-down' },
  { nome: '% Favorável', formula: '(Excelente + Bom) ÷ respostas válidas', uso: 'Satisfação geral' },
  { nome: 'Total de Respostas', formula: 'SOMA( total )', uso: 'Volume de respondentes' },
  { nome: 'Conceito', formula: 'E ≥ 4,7 · B ≥ 4,1 · AP ≥ 3,1 · R ≥ 2,2 · MR < 2,2', uso: 'Cor e rótulo padronizados' },
];

export type NivelDrill = 'area' | 'dimensao' | 'curso' | 'questao';
export const ORDEM_DRILL: NivelDrill[] = ['area', 'dimensao', 'curso', 'questao'];
export const ROTULO_DRILL: Record<NivelDrill, string> = { area: 'Área', dimensao: 'Dimensão', curso: 'Curso', questao: 'Questão' };
const CAMPO: Record<NivelDrill, keyof LinhaResultado> = { area: 'area', dimensao: 'dimensao', curso: 'curso', questao: 'textoQuestao' };

export function agruparPor(rows: LinhaResultado[], nivel: NivelDrill) {
  const map = new Map<string, LinhaResultado[]>();
  rows.forEach((r) => {
    const k = String(r[CAMPO[nivel]] || '(sem valor)');
    map.set(k, [...(map.get(k) || []), r]);
  });
  return [...map.entries()].map(([nome, rs]) => {
    const media = nivel === 'questao' ? mediaQuestoes(rs) : mediaHierarquica(rs);
    return { nome, media, conceito: conceito(media), favoravel: percFavoravel(rs), respostas: totalRespostas(rs) };
  });
}

export const filtrarCaminho = (rows: LinhaResultado[], caminho: { nivel: NivelDrill; valor: string }[]) =>
  rows.filter((r) => caminho.every((c) => String(r[CAMPO[c.nivel]] || '(sem valor)') === c.valor));
