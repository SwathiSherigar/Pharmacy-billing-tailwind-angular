import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FONT } from '../constants/font';

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export interface Patient {
  name: string;
  phone?: string;
  address?: string;
}

export interface Doctor {
  name: string;
  phone?: string;
  address?: string;
}
const termsText = [
  'Terms & Conditions:',
  '• GST not applicable.',
  // '• Medicines once sold cannot be returned.',
  // '• Subject to local jurisdiction.'
];

export interface Item {
  name: string;
  batch?: string;
  qty?: number;
  rate?: number;
  expiry?: string;
  mrp?: number;
}

export interface BillData {
  patient: Patient;
  doctor: Doctor;
  items: Item[];
  invoiceNo?: string;
  dueDate?: string;
  total: number;
  taxRate?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {



  generateBill(data: BillData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });
    (doc as any).addFileToVFS(
      "NotoSans-Regular.ttf",
      FONT);
    (doc as any).addFont(
      "NotoSans-Regular.ttf",
      "NotoSans",
      "normal"
    );

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'bold');
    doc.text('AKASH PHARMA', pageWidth / 2, 12, { align: 'center' });

    // Patient Info
    doc.setFontSize(5);
    doc.setFont('NotoSans', 'normal');

        const margin = 10;
const columnGap = 6;
const doctorOffset = 4;
const usableWidth = pageWidth - margin * 2;
const columnWidth = (usableWidth - columnGap) / 2;
const patientX = margin;
const doctorX = pageWidth - margin - columnWidth +4;
    const drawText = (text: string, x: number, y: number, maxWidth = 60) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * 3; // approximate height increment for next line
    };


doc.setFontSize(5);

// Titles
doc.text('PATIENT INFORMATION', patientX, 18);
doc.text("PRESCRIBING PHYSICIAN'S INFORMATION", doctorX, 18);

let patientY = 22;
let doctorY = 22;

// Patient (LEFT)
patientY += drawText(`Name: ${data.patient.name}`, patientX, patientY, columnWidth);
patientY += drawText(`Phone: ${data.patient.phone || 'N/A'}`, patientX, patientY, columnWidth);
patientY += drawText(`Address: ${data.patient.address || 'N/A'}`, patientX, patientY, columnWidth);

// Doctor (RIGHT)
doctorY += drawText(`Name: ${data.doctor.name}`, doctorX, doctorY, columnWidth);
doctorY += drawText(`Phone: ${data.doctor.phone || 'N/A'}`, doctorX, doctorY, columnWidth);
doctorY += drawText(`Address: ${data.doctor.address || 'N/A'}`, doctorX, doctorY, columnWidth);

    // Invoice Info (Single Line)
    const invoiceY = Math.max(patientY, doctorY) + 2; // below patient & doctor info
const padding = 10;

// Left-aligned: Invoice #
doc.text(`Invoice #: ${data.invoiceNo || 'N/A'}`, padding, invoiceY);

// Right-aligned: Date
doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - padding, invoiceY, { align: 'right' });

    // doc.text(`Due Date: ${data.dueDate || 'N/A'}`, padding + colWidth * 2, invoiceY);
    // doc.text(`Amount Due: ₹${data.total.toFixed(2)}`, padding + colWidth * 3, invoiceY);

    const finalY = doc.lastAutoTable?.finalY || (invoiceY + 4);
    const taxRate = data.taxRate || 0;
    const taxAmount = data.total * (taxRate / 100);
    const grandTotal = data.total + taxAmount;



    const itemRows = data.items.map((i, index) => [
      index + 1,
      i.name,
      i.batch || '',
      (i.rate || 0).toFixed(2),
      i.qty || 0,
      formatDate(i.expiry),
      ((i.qty || 0) * (i.rate || 0)).toFixed(2)
    ]);
    itemRows.push([
  {
    content: termsText.join('\n'),
    colSpan: 6, // spans all columns except MRP
    styles: {
      font: 'NotoSans',
      fontSize: 5,
      valign: 'top',
      halign: 'left'
    }
  } as any,
  {
    content: `Sub Total:  ₹${data.total.toFixed(2)}\nTOTAL:  ₹${grandTotal.toFixed(2)}`,
    styles: {
      font: 'NotoSans',
      fontSize: 5,
      valign: 'middle',
      halign: 'left'
    }
  } as any
] as any);


    // Items Table
    autoTable(doc, {
      startY: invoiceY + 4,
      head: [['S.No', 'Item Name', 'Batch', 'Rate', 'Qty', 'Expiry', 'MRP']],
      body: itemRows,
      theme: 'grid',
      styles: {
        font: 'NotoSans',      // REQUIRED for ₹
        fontSize: 5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fillColor: [220, 220, 220]
      },
      didParseCell: (data) => {
  const summaryRowIndex = itemRows.length - 1;

  if (data.row.index === summaryRowIndex) {
    // Remove LEFT border of MRP column
    if (data.column.index === 6) {
      data.cell.styles.lineWidth = {
        top: 0.1,
        bottom: 0.1,
        left: 0.1,   // remove middle line
        right: 0.1
      };
    }
  }
},

      margin: { left: 10, right: 10 }
    });


    // Totals (RIGHT ALIGNED)

    // const rightX = pageWidth - 10; // small right margin

    // doc.setFontSize(6);
    // doc.setFont('NotoSans', 'normal');
    // doc.text(`Sub Total: ₹${data.total.toFixed(2)}`, rightX, finalY + 5, { align: 'right' });
    // // doc.text(`Tax Rate: ${taxRate}%`, rightX, finalY + 8, { align: 'right' });
    // // doc.text(`Tax: ${taxAmount.toFixed(2)}`, rightX, finalY + 11, { align: 'right' });
    // doc.setFont("NotoSans", "normal");
    // doc.text(`TOTAL: ₹${grandTotal.toFixed(2)}`, rightX, finalY + 8, { align: 'right' });
    // // ---- TERMS & CONDITIONS (FIXED AT PAGE BOTTOM) ----
    // const pageHeight = doc.internal.pageSize.getHeight();
    // const footerMargin = 5;        // bottom margin
    // const lineHeight = 3;           // line spacing
    // const footerY =
    //   pageHeight - footerMargin - (termsText.length * lineHeight);

    // const leftX = 10;

    // doc.setFontSize(5);
    // doc.setFont('NotoSans', 'normal');
    // doc.text(termsText, leftX, footerY);


    function formatDate(expiry?: string): string {
      return expiry || '';
    }


    // Save PDF
    doc.save('Invoice.pdf');
  }


}
