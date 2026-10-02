import jsPDF from 'jspdf';
import { Transaction } from '../types';
import { formatDateBR, formatCurrencyNumber, getMonthNameAndYear } from './formatters';

interface ExportReportOptions {
  month: string;
  userName: string;
  transactions: Transaction[];
  accounts?: any[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryTotals: Array<{ name: string; amount: number; percentage: number }>;
}

export const generateAndDownloadCSV = (options: ExportReportOptions) => {
  const { transactions, month } = options;

  // Filter by month
  const filtered = transactions.filter(t => t.date.startsWith(month));

  // Sort by date desc
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  // CSV header
  const headers = [
    'Data',
    'Descrição',
    'Tipo',
    'Categoria',
    'Valor (R$)',
    'Status',
    'Forma de Pagamento',
    'Observações'
  ];

  const rows = filtered.map(t => [
    formatDateBR(t.date),
    `"${t.description.replace(/"/g, '""')}"`,
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    `"${t.category}"`,
    t.type === 'expense' ? `-${t.amount.toFixed(2)}` : t.amount.toFixed(2),
    t.status === 'paid' ? 'Efetivado / Pago' : 'Pendente',
    t.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : t.paymentMethod === 'pix' ? 'PIX' : t.paymentMethod === 'debit' ? 'Cartão de Débito' : 'Dinheiro',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  // Use semicolon for Brazilian Excel compatibility
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\r\n');

  // Prepend UTF-8 BOM
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `aquigastos-relatorio-${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateAndDownloadPDF = (options: ExportReportOptions) => {
  const {
    month,
    userName,
    transactions,
    totalIncome,
    totalExpense,
    netBalance,
    categoryTotals,
  } = options;

  const filtered = transactions.filter(t => t.date.startsWith(month));
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // Header Background Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO FINANCEIRO MENSAL', 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`AquiGastos | Gestão Financeira`, 15, 18);

  // User / Date info top right
  doc.setFontSize(9);
  const dateGenerated = new Date().toLocaleDateString('pt-BR');
  doc.text(`Emissão: ${dateGenerated}`, pageWidth - 15, 12, { align: 'right' });
  doc.text(`Titular: ${userName}`, pageWidth - 15, 18, { align: 'right' });

  currentY = 36;

  // Filter badge and period
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Demonstrativo: ${getMonthNameAndYear(month)}`, 15, currentY);

  currentY += 8;

  // KPI Summary Cards
  const cardWidth = (pageWidth - 30 - 6) / 3;
  const cardHeight = 22;

  // Card 1: Receitas
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL ENTRADAS', 20, currentY + 7);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`+ R$ ${formatCurrencyNumber(totalIncome)}`, 20, currentY + 16);

  // Card 2: Despesas
  const card2X = 15 + cardWidth + 3;
  doc.setFillColor(255, 241, 242); // light red
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL SAÍDAS', card2X + 5, currentY + 7);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`- R$ ${formatCurrencyNumber(totalExpense)}`, card2X + 5, currentY + 16);

  // Card 3: Saldo Líquido
  const card3X = card2X + cardWidth + 3;
  const isPositive = netBalance >= 0;
  doc.setFillColor(isPositive ? 240 : 255, isPositive ? 253 : 241, isPositive ? 250 : 242);
  doc.setDrawColor(isPositive ? 153 : 254, isPositive ? 246 : 205, isPositive ? 228 : 211);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isPositive ? 17 : 159, isPositive ? 94 : 18, isPositive ? 89 : 57);
  doc.text('RESULTADO LÍQUIDO', card3X + 5, currentY + 7);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${isPositive ? '+' : '-'} R$ ${formatCurrencyNumber(Math.abs(netBalance))}`, card3X + 5, currentY + 16);

  currentY += cardHeight + 8;

  // Top Categories breakdown if any
  if (categoryTotals.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Distribuição por Maiores Gastos', 15, currentY);
    currentY += 4;

    const topCats = categoryTotals.slice(0, 5);
    const catColWidth = (pageWidth - 30) / topCats.length;

    topCats.forEach((cat, idx) => {
      const cx = 15 + idx * catColWidth;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cx, currentY, catColWidth - 2, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const name = cat.name.length > 15 ? cat.name.substring(0, 13) + '..' : cat.name;
      doc.text(name, cx + 2.5, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`R$ ${formatCurrencyNumber(cat.amount)} (${cat.percentage.toFixed(0)}%)`, cx + 2.5, currentY + 9.5);
    });

    currentY += 16;
  }

  // Transaction Ledger Table Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Detalhamento dos Lançamentos (${filtered.length})`, 15, currentY);
  currentY += 4;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, pageWidth - 30, 6.5, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Data', 18, currentY + 4.5);
  doc.text('Descrição', 38, currentY + 4.5);
  doc.text('Categoria', 115, currentY + 4.5);
  doc.text('Valor', pageWidth - 18, currentY + 4.5, { align: 'right' });

  currentY += 7.5;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i];

    // Page break if needed
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 15;

      // Repeat table header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, pageWidth - 30, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Data', 18, currentY + 4.5);
      doc.text('Descrição', 38, currentY + 4.5);
      doc.text('Categoria', 115, currentY + 4.5);
      doc.text('Valor', pageWidth - 18, currentY + 4.5, { align: 'right' });
      currentY += 7.5;
      doc.setFont('helvetica', 'normal');
    }

    // Zebra striping
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(15, currentY, pageWidth - 30, 6, 'F');
    }

    doc.setTextColor(71, 85, 105);
    doc.text(formatDateBR(t.date), 18, currentY + 4.2);

    doc.setTextColor(30, 41, 59);
    const desc = t.description.length > 42 ? t.description.substring(0, 40) + '...' : t.description;
    doc.text(desc, 38, currentY + 4.2);

    const catName = t.category.length > 25 ? t.category.substring(0, 23) + '...' : t.category;
    doc.text(catName, 115, currentY + 4.2);

    // Value color
    if (t.type === 'income') {
      doc.setTextColor(16, 185, 129); // green
      doc.text(`+ R$ ${formatCurrencyNumber(t.amount)}`, pageWidth - 18, currentY + 4.2, { align: 'right' });
    } else {
      doc.setTextColor(225, 29, 72); // red
      doc.text(`- R$ ${formatCurrencyNumber(t.amount)}`, pageWidth - 18, currentY + 4.2, { align: 'right' });
    }

    currentY += 6;
  }

  // Footer note on last page
  currentY = Math.min(currentY + 8, pageHeight - 12);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado pelo AquiGastos.', 15, currentY);
  doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - 15, currentY, { align: 'right' });

  // Download
  doc.save(`aquigastos-relatorio-${month}.pdf`);
};
