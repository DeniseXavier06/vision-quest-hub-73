import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { conceito } from './medidas';
import type { areasParaAcao } from './storytelling-discentes';

type Prioridade = ReturnType<typeof areasParaAcao>[number];

const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** PDF de prioridades para planos de ação, agrupado por curso, com áreas e questões prioritárias. */
export function baixarPdfPlanoAcao(prioridades: Prioridade[], subtitulo: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 14;

  doc.setFontSize(16);
  doc.text('Prioridades para os planos de ação — Discentes', margem, 18);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(subtitulo, margem, 25);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · Conceitos: Atende Parcialmente, Regular e Muito Ruim`, margem, 30);
  doc.setTextColor(0);

  const cursos = [...new Set(prioridades.map(p => `${p.curso}|${p.nivel}`))].sort((a, b) => a.localeCompare(b));
  let y = 36;

  cursos.forEach(chave => {
    const [curso, nivel] = chave.split('|');
    const doCurso = prioridades.filter(p => p.curso === curso && p.nivel === nivel);
    if (y > altura - 40) { doc.addPage(); y = margem; }
    doc.setFontSize(12);
    doc.text(`${curso} · ${nivel}`, margem, y);
    y += 2;
    autoTable(doc, {
      startY: y + 2,
      margin: { left: margem, right: margem },
      head: [['Dimensão', 'Área', 'Média', 'Conceito', 'Questões prioritárias (média)']],
      body: doCurso.map(p => [
        p.dimensao,
        p.area,
        fmt(p.media),
        p.conceito,
        p.evidencias.map(e => `• ${e.questao} (${fmt(e.media)})`).join('\n'),
      ]),
      styles: { fontSize: 8, cellPadding: 1.6, valign: 'top' },
      headStyles: { fillColor: [30, 64, 120] },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 30 }, 2: { cellWidth: 12, halign: 'right' }, 3: { cellWidth: 24 }, 4: { cellWidth: 'auto' } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  });

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${paginas}`, largura - margem, altura - 6, { align: 'right' });
  }

  doc.save(`plano-de-acao-discentes-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export { conceito };
