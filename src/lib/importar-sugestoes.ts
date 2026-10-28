import * as XLSX from 'xlsx';
import { z } from 'zod';

export const COLUNAS_SUGESTOES = ['NOME_CURSO', 'NIVEL', 'DIMENSAO', 'AREA', 'CODIGO_TURMA', 'CODIGO_PROVA', 'NOME_PROVA', 'CODIGO_QUESTAO', 'TEXTO_QUESTAO', 'DISCIPLINA_AVALIADA', 'PROFESSOR_AVALIADO', 'COORDENADOR_AVALIADO', 'SUGESTAO'] as const;
export type LinhaSugestao = Record<Lowercase<typeof COLUNAS_SUGESTOES[number]>, string>;
const textoSugestao = z.string().trim().min(1, 'Sugestão vazia');

export function converterSugestoes(rows: Record<string, unknown>[], mapping: Record<string, string>): LinhaSugestao[] {
  return rows.map(row => {
    const result = Object.fromEntries(COLUNAS_SUGESTOES.map(c => [c.toLowerCase(), String(row[mapping[c] || c] ?? '').trim()])) as LinhaSugestao;
    return result;
  }).filter(row => textoSugestao.safeParse(row.sugestao).success);
}

export async function lerArquivoSugestoes(file: File) {
  const csv = /\.(csv|txt)$/i.test(file.name);
  const workbook = XLSX.read(csv ? await file.text() : await file.arrayBuffer(), { type: csv ? 'string' : 'array' });
  const name = workbook.SheetNames[0];
  const sheet = name ? workbook.Sheets[name] : undefined;
  if (!sheet) throw new Error('Arquivo sem planilha');
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  const columns = (grid[0] || []).map(c => String(c).trim());
  const rows = grid.slice(1).filter(r => r.some(v => String(v).trim())).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ''])));
  const mapping = Object.fromEntries(COLUNAS_SUGESTOES.map(c => [c, columns.find(h => h.toUpperCase() === c) || '']));
  return { columns, rows, mapping };
}