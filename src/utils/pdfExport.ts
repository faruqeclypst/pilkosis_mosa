// src/utils/pdfExport.ts

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Candidate, SchoolInfo } from '../types';

export const exportToPDF = async (candidates: Candidate[], schoolInfo: SchoolInfo) => {
  const pdf = new jsPDF();
  const currentYear = new Date().getFullYear();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;

  const addUnderlinedText = (text: string, x: number, y: number, fontSize: number) => {
    pdf.setFontSize(fontSize);
    pdf.text(text, x, y, { align: 'center' });
    const textWidth = pdf.getTextWidth(text);
    pdf.line(x - textWidth / 2, y + 1, x + textWidth / 2, y + 1);
  };

  addUnderlinedText('Hasil Akhir Pemilihan Ketua Osis', pageWidth / 2, 15, 16);
  pdf.setFontSize(14);
  pdf.text(schoolInfo.name, pageWidth / 2, 25, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(`Tahun ${currentYear}`, pageWidth / 2, 33, { align: 'center' });

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  pdf.setFontSize(12);
  pdf.text(`Total Vote: ${totalVotes}`, margin, 45);

  const tableColumn = ["Peringkat", "Nama Kandidat", "Jumlah Vote", "Persentase"];
  const tableRows = candidates
    .sort((a, b) => b.voteCount - a.voteCount)
    .map((candidate, index) => {
      const percentage = (candidate.voteCount / totalVotes * 100).toFixed(2);
      return [index + 1, candidate.name, candidate.voteCount, `${percentage}%`];
    });

  const startY = 55;
  pdf.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    headStyles: { fillColor: [0, 101, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    bodyStyles: { textColor: 50 },
    margin: { left: margin, right: margin },
  });

  const finalY = (pdf as any).lastAutoTable.finalY || startY;

 const addChartToPDF = async (chartType: 'pie' | 'bar', title: string, yPosition: number) => {
  const chartContainer = document.getElementById(`${chartType}-chart-container`);
  if (chartContainer) {
    const canvas = await html2canvas(chartContainer, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.setFontSize(14);
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    pdf.addImage(imgData, 'PNG', margin, yPosition + 10, imgWidth, imgHeight);

    return yPosition + imgHeight + 25;
  }
  return yPosition;
};

  let nextY = finalY + 20;
  if (nextY + 130 > pageHeight) {
    pdf.addPage();
    nextY = 20;
  }
  nextY = await addChartToPDF('pie', 'Pie Chart Hasil Pemilihan', nextY);

  if (nextY + 130 > pageHeight) {
    pdf.addPage();
    nextY = 20;
  }
  await addChartToPDF('bar', 'Bar Chart Hasil Pemilihan', nextY);

  pdf.save(`Hasil_Pemilihan_OSIS_${schoolInfo.name}_${currentYear}.pdf`);
};