import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FONT } from '../constants/font';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export interface Patient { name: string; phone?: string; address?: string; }
export interface Doctor { name: string; phone?: string; address?: string; }
export interface Item { name: string; batch?: string; qty?: number; rate?: number; expiry?: string; mrp?: number; }
export interface BillData { patient: Patient; doctor: Doctor; items: Item[]; invoiceNo?: string; dueDate?: string; total: number; taxRate?: number; date?: any; }

@Injectable({ providedIn: 'root' })
export class PdfService {

  constructor() { }

  generateBill(data: BillData) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5'
    });

    (doc as any).addFileToVFS("NotoSans-Regular.ttf", FONT);
    (doc as any).addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    (doc as any).addFont("NotoSans-Regular.ttf", "NotoSans", "bold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 7;
    const contentWidth = pageWidth - 2 * margin;

    // ─── HEADER ───
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(28, 43, 112);
    doc.text('AKASH PHARMA', pageWidth / 2, 11, { align: 'center' });

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text('DL No: KA-BE2-274111  |  GSTIN: 29XXXXX1234X1ZX', pageWidth / 2, 16, { align: 'center' });
    doc.text('1/326 Main Road, Hurulihal, Kudligi, Karnataka 583126', pageWidth / 2, 20, { align: 'center' });
    doc.text('Ph: +91 9876543210  |  Email: contact@akashpharma.com', pageWidth / 2, 24, { align: 'center' });

    // Double line separator
    doc.setDrawColor(28, 43, 112);
    doc.setLineWidth(0.5);
    doc.line(margin, 27, pageWidth - margin, 27);
    doc.setLineWidth(0.15);
    doc.line(margin, 28, pageWidth - margin, 28);

    // ─── INVOICE ROW ───
    const billDate = data.date ? new Date(data.date) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr =
      `${pad(billDate.getDate())}/${pad(billDate.getMonth() + 1)}/${billDate.getFullYear()}`;
    const timeStr =
      `${pad(billDate.getHours())}:${pad(billDate.getMinutes())}:${pad(billDate.getSeconds())}`;

    let y = 32;
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 43, 112);
    doc.text(`Invoice #: ${data.invoiceNo || 'N/A'}`, margin, y);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Date: ${dateStr}   Time: ${timeStr}`, pageWidth - margin, y, { align: 'right' });

    // ─── PATIENT & DOCTOR — bordered boxes, no fill ───
    y += 5;
    const boxGap = 4;
    const halfWidth = (contentWidth - boxGap) / 2;
    const boxH = 22;
    const boxPad = 3;
    const labelX = 20; // offset for values after label

    // Patient box
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y - 1, halfWidth, boxH, 1, 1, 'S');

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(28, 43, 112);
    doc.text('PATIENT', margin + boxPad, y + 3);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.setFont('NotoSans', 'normal');
    doc.text('Name:', margin + boxPad, y + 8);
    doc.text('Phone:', margin + boxPad, y + 13);
    doc.text('Address:', margin + boxPad, y + 18);

    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(data.patient.name, margin + labelX, y + 8);
    doc.setFont('NotoSans', 'normal');
    doc.text(data.patient.phone || 'N/A', margin + labelX, y + 13);
    const patAddr = doc.splitTextToSize(data.patient.address || 'N/A', halfWidth - labelX - boxPad);
    doc.text(patAddr, margin + labelX, y + 18);

    // Doctor box
    const docX = margin + halfWidth + boxGap;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.roundedRect(docX, y - 1, halfWidth, boxH, 1, 1, 'S');

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(28, 43, 112);
    doc.text('PRESCRIBING PHYSICIAN', docX + boxPad, y + 3);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.setFont('NotoSans', 'normal');
    doc.text('Name:', docX + boxPad, y + 8);
    doc.text('Phone:', docX + boxPad, y + 13);
    doc.text('Address:', docX + boxPad, y + 18);

    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(data.doctor.name, docX + labelX, y + 8);
    doc.setFont('NotoSans', 'normal');
    doc.text(data.doctor.phone || 'N/A', docX + labelX, y + 13);
    const docAddr = doc.splitTextToSize(data.doctor.address || 'N/A', halfWidth - labelX - boxPad);
    doc.text(docAddr, docX + labelX, y + 18);

    // ─── ITEMS TABLE (maximised) ───
    const tableStartY = y + boxH + 2;
    const footerReserve = 26;
    const itemRows: any[] = data.items.map((i, idx) => [
      idx + 1,
      i.name,
      i.batch || '',
      (i.rate || 0).toFixed(2),
      i.qty || 0,
      i.expiry || '',
      ((i.qty || 0) * (i.rate || 0)).toFixed(2)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Description', 'Batch', 'Rate (\u20B9)', 'Qty', 'Expiry', 'Amount (\u20B9)']],
      body: itemRows,
      theme: 'grid',
      styles: {
        font: 'NotoSans',
        fontSize: 8,
        textColor: [40, 40, 40],
        lineWidth: 0.1,
        lineColor: [210, 210, 210],
        cellPadding: { top: 1.8, right: 2, bottom: 1.8, left: 2 }
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 }
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      // alternateRowStyles: {
      //   fillColor: [250, 250, 255]
      // },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 'auto' },
        3: { halign: 'left', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 13 },
        5: { cellWidth: 20 },
        6: { halign: 'left', cellWidth: 24 }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    // ─── FOOTER — always at the bottom ───
    const grandTotal = data.total + (data.total * ((data.taxRate || 0) / 100));
    const footerTopY = pageHeight - footerReserve + 2;

    // Separator line above footer
    doc.setDrawColor(28, 43, 112);
    doc.setLineWidth(0.2);
    doc.line(margin, footerTopY - 1, pageWidth - margin, footerTopY - 1);

    // --- Left side: Terms ---
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('Terms & Conditions:', margin, footerTopY + 3);
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(6.5);
    doc.text('\u2022  GST not applicable.', margin, footerTopY + 7);
    doc.text('\u2022  Goods once sold will not be taken back.', margin, footerTopY + 11);
    doc.text('\u2022  Subject to local jurisdiction.', margin, footerTopY + 15);

    // --- Right side: Total summary ---
    const totalColX = pageWidth - margin - 65;
    const valX = pageWidth - margin;

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('Subtotal:', totalColX, footerTopY + 3);
    doc.text(`\u20B9${data.total.toFixed(2)}`, valX, footerTopY + 3, { align: 'right' });

    let totalOffsetY = 7;
    if (data.taxRate && data.taxRate > 0) {
      doc.text(`Tax (${data.taxRate}%):`, totalColX, footerTopY + totalOffsetY);
      doc.text(`\u20B9${(data.total * (data.taxRate / 100)).toFixed(2)}`, valX, footerTopY + totalOffsetY, { align: 'right' });
      totalOffsetY += 4;
    }

    // Grand total separator
    doc.setDrawColor(28, 43, 112);
    doc.setLineWidth(0.3);
    doc.line(totalColX, footerTopY + totalOffsetY, valX, footerTopY + totalOffsetY);

    totalOffsetY += 5;
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(28, 43, 112);
    doc.text('GRAND TOTAL:', totalColX, footerTopY + totalOffsetY);
    doc.text(`\u20B9${grandTotal.toFixed(2)}`, valX, footerTopY + totalOffsetY, { align: 'right' });

    // ─── BOTTOM BAR ───
    doc.setDrawColor(28, 43, 112);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 5, pageWidth - margin, pageHeight - 5);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text('Thank you for choosing Akash Pharma  |  This is a computer-generated invoice', pageWidth / 2, pageHeight - 2, { align: 'center' });

    // Reset
    doc.setTextColor(0, 0, 0);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  }
}
