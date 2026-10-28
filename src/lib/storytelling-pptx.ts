import PptxGenJS from 'pptxgenjs';
import { conceito, CONCEITO_CORES, mediaHierarquica, percFavoravel, totalRespostas } from './medidas';
import { areasParaAcao, compararAnos, resumirGrupos, recorteCurso, type ResultadoDiscente } from './storytelling-discentes';

const palette = { ink: '243A36', accent: '168578', paper: 'F7FAF9', muted: '526660', rule: 'DCE7E2', white: 'FFFFFF' };
const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const chunks = <T,>(items: T[], size: number): T[][] => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** Builds the full filtered story, independently of chart drill and table pagination. */
export function criarPowerPointDiscentes(rows: ResultadoDiscente[], anos: string[], filtros: string[]) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'CPA UniRios';
  pptx.subject = 'Autoavaliação institucional — resultados discentes';
  pptx.title = `Discentes ${anos.join('–')}`;
  pptx.lang = 'pt-BR';
  pptx.theme = { headFontFace: 'Trebuchet MS', bodyFontFace: 'Calibri', lang: 'pt-BR' };
  let numero = 0;
  const slideBase = (titulo: string, contexto = '', dark = false) => {
    const slide = pptx.addSlide();
    slide.background = { color: dark ? palette.ink : palette.paper };
    slide.addText(titulo, { x: 0.6, y: 0.45, w: 12.1, h: 1.1, fontSize: 32, bold: true, color: dark ? palette.white : palette.ink, margin: 0, breakLine: false });
    slide.addText(contexto, { x: 0.6, y: 1.6, w: 12.1, h: 0.65, fontSize: 16, color: dark ? palette.rule : palette.muted, margin: 0 });
    slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 6.82, w: 0.16, h: 0.16, fill: { color: palette.accent }, line: { color: palette.accent } });
    slide.addText(`CPA UniRios · ${anos.join(' / ')} · ${++numero}`, { x: 0.9, y: 6.8, w: 11.8, h: 0.3, fontSize: 12, color: dark ? palette.rule : palette.muted, margin: 0 });
    return slide;
  };
  const textoSlide = (titulo: string, textos: string[], dark = false) => {
    const slide = slideBase(titulo, filtros.join(' · ') || 'Todos os níveis e cursos', dark);
    textos.forEach((texto, i) => {
      slide.addShape(pptx.ShapeType.ellipse, { x: 0.65, y: 2.55 + i * 0.95, w: 0.35, h: 0.35, fill: { color: palette.accent }, line: { color: palette.accent } });
      slide.addText(texto, { x: 1.2, y: 2.4 + i * 0.95, w: 11.3, h: 0.8, fontSize: 21, margin: 0, color: dark ? palette.white : palette.ink });
    });
  };
  const media = mediaHierarquica(rows);
  const ultimo = anos[anos.length - 1];
  const prioridades = areasParaAcao(rows.filter(r => r.semestre.trim().startsWith(ultimo || '2026')));
  textoSlide(`Discentes / ${anos.length > 1 ? 'Triênio 2024–2026' : '2026'}`, [
    `Média geral: ${fmt(media)} · ${conceito(media)} · escala de 0 a 5`,
    `${fmt(percFavoravel(rows))}% de respostas favoráveis · ${totalRespostas(rows).toLocaleString('pt-BR')} respostas às questões`,
    `${resumirGrupos(rows, 'curso').length} cursos · ${prioridades.length} recortes de área prioritários em ${ultimo}`,
    'Respostas não representam pessoas únicas. Participação não entra nas médias.',
  ], true);
  textoSlide('O que os discentes revelam?', [
    `Média por ano: ${anos.map(a => { const recorte = rows.filter(r => r.semestre.trim().startsWith(a)); return `${a}: ${recorte.length ? fmt(mediaHierarquica(recorte)) : 'sem dados'}`; }).join(' · ')}`,
    'Média CPA: média das linhas das questões por área, seguida da média das áreas.',
    'A média geral não deve ocultar áreas em Atende Parcialmente, Regular ou Muito Ruim.',
    'Professores e áreas sem identificação não recebem classificações inventadas.',
  ]);
  const grafico = (titulo: string, recorte: ResultadoDiscente[], campo: Parameters<typeof resumirGrupos>[1], contexto = '') => {
    const dados = compararAnos(recorte, campo, anos);
    if (!dados.length) { textoSlide(titulo, ['Não há resultados identificados para este agrupamento.']); return; }
    for (const [pagina, lote] of chunks(dados, 4).entries()) {
      const slide = slideBase(titulo, `${contexto || 'Médias e conceitos por indicador'} · ${pagina + 1}/${Math.ceil(dados.length / 4)}`);
      lote.forEach((d, i) => {
        const y = 2.4 + i * 1.04;
        slide.addText(String(d.nome), { x: 0.6, y, w: 4.45, h: 0.8, fontSize: 18, bold: true, color: palette.ink, margin: 0 });
        anos.forEach((ano, j) => {
          const valor = d[ano];
          const n = typeof valor === 'number' ? valor : null;
          const by = y + j * 0.27;
          slide.addText(anos.length > 1 ? ano : 'Média', { x: 5.15, y: by, w: 0.65, h: 0.24, fontSize: 12, color: palette.muted, margin: 0 });
          slide.addShape(pptx.ShapeType.rect, { x: 5.85, y: by, w: 3.8, h: 0.2, fill: { color: palette.rule }, line: { color: palette.rule } });
          if (n !== null && n > 0) slide.addShape(pptx.ShapeType.rect, { x: 5.85, y: by, w: 3.8 * Math.min(n, 5) / 5, h: 0.2, fill: { color: (CONCEITO_CORES[conceito(n)] || '#168578').replace('#', '') }, line: { transparency: 100 } });
          slide.addText(n === null ? 'Sem dados' : `${fmt(n)} · ${conceito(n)}`, { x: 9.85, y: by - 0.01, w: 2.8, h: 0.26, fontSize: 12, color: palette.ink, margin: 0 });
        });
      });
      slide.addNotes('Escala de 0 a 5. Valores ausentes são mostrados como Sem dados, nunca como zero. As médias usam o modelo semântico compartilhado da CPA.');
    }
  };
  for (const [campo, titulo] of [['curso', 'Médias por curso'], ['dimensao', 'Médias por dimensão'], ['eixo', 'Médias por eixo'], ['professor', 'Médias por professor'], ['area', 'Médias por área']] as const) grafico(titulo, rows, campo);
  for (const curso of resumirGrupos(rows, 'curso')) {
    const recorte = recorteCurso(rows, curso.nome, null);
    grafico('Dimensões do curso', recorte, 'dimensao', curso.nome);
    for (const dim of resumirGrupos(recorte, 'dimensao')) grafico('Áreas da dimensão', recorteCurso(rows, curso.nome, dim.nome), 'area', `${curso.nome} › ${dim.nome}`);
  }
  for (const eixo of resumirGrupos(rows, 'eixo')) grafico('Áreas do eixo', rows.filter(r => r.eixo === eixo.nome), 'area', eixo.nome);
  if (!prioridades.length) textoSlide('Prioridades para os planos de ação', [`Nenhuma área por curso e nível ficou nos conceitos prioritários em ${ultimo}.`]);
  for (const p of prioridades) {
    for (const [i, lote] of chunks(p.evidencias, 4).entries()) {
      const slide = slideBase('Prioridades para os planos de ação', `${p.curso} · ${p.nivel} · ${p.dimensao} · ${p.area}`);
      slide.addText(`Média ${fmt(p.media)} · ${p.conceito} · ${ultimo} · Questões ${i * 4 + 1}–${i * 4 + lote.length}`, { x: 0.6, y: 2.25, w: 12, h: 0.4, fontSize: 18, bold: true, color: palette.accent, margin: 0 });
      lote.forEach((q, j) => {
        const y = 2.95 + j * 0.85;
        slide.addText(q.questao, { x: 0.6, y, w: 8.9, h: 0.72, fontSize: 18, color: palette.ink, margin: 0 });
        slide.addText(`${fmt(q.media)}\n${conceito(q.media)}`, { x: 9.8, y, w: 2.8, h: 0.72, fontSize: 16, bold: true, color: palette.ink, margin: 0 });
      });
      slide.addNotes('Ação proposta para validação da coordenação: investigar causas usando as questões com menor média, ouvir alunos e equipes, pactuar responsável, prazo e meta e acompanhar a próxima avaliação.');
    }
  }
  textoSlide('Da escuta à ação', [
    'Priorizar áreas Muito Ruim e Regular, preservando o recorte por curso e nível.',
    'Investigar as questões com menor média e validar causas com alunos e equipes.',
    'Pactuar ação, responsáveis, prazo, meta e evidências no menu Ações.',
    'Acompanhar melhorias e comparar o indicador no próximo ciclo avaliativo.',
  ], true);
  return pptx;
}

export async function baixarPowerPointDiscentes(rows: ResultadoDiscente[], anos: string[], filtros: string[]) {
  await criarPowerPointDiscentes(rows, anos, filtros).writeFile({ fileName: `CPA-Discentes-${anos.join('-')}.pptx` });
}