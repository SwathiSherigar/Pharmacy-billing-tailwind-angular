import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FONT } from '../constants/font';
import { PdfSettingsService } from './pdf-settings/pdf-settings';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export interface Patient { name: string; phone?: string; address?: string; }
export interface Doctor { name: string; phone?: string; address?: string; }
export interface Item { name: string; batch?: string; qty?: number; rate?: number; expiry?: string; mrp?: number; }
export interface BillData { patient: Patient; doctor: Doctor; items: Item[]; invoiceNo?: string; dueDate?: string; total: number; taxRate?: number; date?: any; }

const termsText = ['Terms & Conditions:', '• GST not applicable.'];

@Injectable({ providedIn: 'root' })
export class PdfService {

  constructor(private pdfSettings: PdfSettingsService) { }


  generateBill(data: BillData) {
    const settings = this.pdfSettings.getSettings();
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5'
    });

    (doc as any).addFileToVFS("NotoSans-Regular.ttf", FONT);
    (doc as any).addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    (doc as any).addFont("NotoSans-Regular.ttf", "NotoSans", "bold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const colWidth = 55;
    const doctorStartX = pageWidth - margin - colWidth;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(settings.headingSize);
    doc.text('AKASH PHARMA', pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(settings.normalTextSize);
    doc.setFont('NotoSans', 'normal');
    let headerY = 18;
    doc.text('Licence No: KA-BE2-274111', pageWidth / 2, headerY, { align: 'center' });
    headerY += 5;
    doc.text('1/326 MAIN ROAD HURULIHAL, KUDLIGI, Hurlihalu, Karnataka 583126', pageWidth / 2, headerY, { align: 'center' });
    headerY += 5;
    doc.text('Phone: +91 9876543210 | Email: contact@akashpharma.com', pageWidth / 2, headerY, { align: 'center' });

    let infoRowY = headerY + 7;
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(settings.normalTextSize);
    doc.text(`Invoice #: ${data.invoiceNo || 'N/A'}`, margin, infoRowY);
    const billDate = data.date ? new Date(data.date) : new Date();

    // doc.text(
    //   `Date: ${billDate.toLocaleDateString()}`,
    //   pageWidth - margin,
    //   infoRowY,
    //   { align: 'right' }
    // );

    const pad = (n: number) => n.toString().padStart(2, '0');

    const formatted =
      `${pad(billDate.getDate())}/${pad(billDate.getMonth() + 1)}/${billDate.getFullYear()} ` +
      `${pad(billDate.getHours())}:${pad(billDate.getMinutes())}:${pad(billDate.getSeconds())}`;

    doc.text(
      `Date & Time: ${formatted}`,
      pageWidth - margin,
      infoRowY,
      { align: 'right' }
    );


    let sectionTitleY = infoRowY + 10;
    doc.text('Patient Information', margin, sectionTitleY);
    doc.text("Prescribing Physician's Information", doctorStartX, sectionTitleY);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(settings.normalTextSize);
    const drawBlock = (name: string, phone: string, addr: string, x: number) => {
      let currentY = sectionTitleY + 4;
      const nameLines = doc.splitTextToSize(`Name: ${name}`, colWidth);
      const phoneLines = doc.splitTextToSize(`Phone: ${phone}`, colWidth);
      const addrLines = doc.splitTextToSize(`Address: ${addr}`, colWidth);
      doc.text(nameLines, x, currentY);
      currentY += nameLines.length * 3;
      currentY += 1;
      doc.text(phoneLines, x, currentY);
      currentY += phoneLines.length * 3;
      currentY += 1;
      doc.text(addrLines, x, currentY);
      currentY += addrLines.length * 3;
      currentY += 1;
      return currentY;
    };

    const pFinalY = drawBlock(data.patient.name, data.patient.phone || 'N/A', data.patient.address || 'N/A', margin);
    const dFinalY = drawBlock(data.doctor.name, data.doctor.phone || 'N/A', data.doctor.address || 'N/A', doctorStartX);

    const tableStartY = Math.max(pFinalY, dFinalY) + 3;
    const itemRows: any[] = data.items.map((i, index) => [
      index + 1,
      i.name,
      i.batch || '',
      (i.rate || 0).toFixed(2),
      i.qty || 0,
      i.expiry || '',
      ((i.qty || 0) * (i.rate || 0)).toFixed(2)
    ]);

    const grandTotal = data.total + (data.total * ((data.taxRate || 0) / 100));

    itemRows.push([
      {
        content: termsText.join('\n'),
        colSpan: 5,
        styles: { halign: 'left' }
      },
      {
        content: `TOTAL`,
        styles: { halign: 'left', fontStyle: 'bold' }
      },
      {
        content: `₹${grandTotal.toFixed(2)}`,
        styles: { halign: 'left', fontStyle: 'bold' }
      }
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['S.No', 'Description', 'Batch', 'Rate', 'Qty', 'Expiry', 'Total']],
      body: itemRows,
      theme: 'grid',
      styles: { font: 'NotoSans', fontSize: settings.tableSize, textColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold' },

      didParseCell: (cellData) => {
        const isLastRow = cellData.row.index === itemRows.length - 1;
        if (isLastRow) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.font = 'NotoSans';

          cellData.cell.styles.fillColor = [255, 255, 255];
        }
      },
      margin: { left: margin, right: margin }
    });


    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  }
}