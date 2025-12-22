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

export interface Item {
  name: string;
  batch?: string;
  qty?: number;
  rate?: number;
  expiry?: string;
  mrp?: number;
  gst?:number;
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
      FONT );
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
    const drawText = (text: string, x: number, y: number, maxWidth = 60) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * 3; // approximate height increment for next line
    };

    // Patient Info
    doc.text('PATIENT INFORMATION', 10, 18);
    let patientY = 22;
    patientY += drawText(`Name: ${data.patient.name}`, 10, patientY);
    patientY += drawText(`Phone: ${data.patient.phone || 'N/A'}`, 10, patientY);
    patientY += drawText(`Address: ${data.patient.address || 'N/A'}`, 10, patientY);

    // Doctor Info
    doc.text("PRESCRIBING PHYSICIAN'S INFORMATION", 80, 18);
    let doctorY = 22;
    doctorY += drawText(`Name: ${data.doctor.name}`, 80, doctorY);
    doctorY += drawText(`Phone: ${data.doctor.phone || 'N/A'}`, 80, doctorY);
    doctorY += drawText(`Address: ${data.doctor.address || 'N/A'}`, 80, doctorY);

    // Invoice Info (Single Line)
    const invoiceY = 34;
    const padding = 10;
    const maxWidth = pageWidth - 2 * padding;
    const colWidth = maxWidth / 4;

    doc.setFontSize(5);
    doc.text(`Invoice #: ${data.invoiceNo || 'N/A'}`, padding, invoiceY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, padding + colWidth, invoiceY);
    doc.text(`Due Date: ${data.dueDate || 'N/A'}`, padding + colWidth * 2, invoiceY);
    doc.text(`Amount Due: ₹${data.total.toFixed(2)}`, padding + colWidth * 3, invoiceY);

    // Items Table
    autoTable(doc, {
      startY: invoiceY + 4,
  head: [['Item Name', 'Batch', 'Rate', 'Qty', 'GST%', 'Expiry', 'MRP']],
  body: data.items.map(i => [
    i.name,
    i.batch || '',
    (i.rate || 0).toFixed(2),
    i.qty || 0,
    i.gst || 0,
    formatDate(i.expiry),
    ((i.qty || 0) * (i.rate || 0) * (1 + (i.gst || 0)/100)).toFixed(2)
  ]),

      theme: 'grid',
      styles: { fontSize: 5 }, // smaller font for many items
      headStyles: { fillColor: [220, 220, 220] },
      margin: { top: 0, bottom: 0, left: 10, right: 10 }
    });


    // Totals (RIGHT ALIGNED)
    const finalY = doc.lastAutoTable?.finalY || (invoiceY + 4);
    const taxRate = data.taxRate || 0;
    const taxAmount = data.total * (taxRate / 100);
    const grandTotal = data.total + taxAmount;

    const rightX = pageWidth - 10; // small right margin

    doc.setFontSize(6);
    doc.setFont('NotoSans', 'normal');
    doc.text(`Sub Total: ₹${data.total.toFixed(2)}`, rightX, finalY + 5, { align: 'right' });
    doc.text(`Tax Rate: ${taxRate}%`, rightX, finalY + 8, { align: 'right' });
    doc.text(`Tax: ${taxAmount.toFixed(2)}`, rightX, finalY + 11, { align: 'right' });
    doc.setFont("NotoSans", "normal");
    doc.text(`TOTAL: ₹${grandTotal.toFixed(2)}`, rightX, finalY + 16, { align: 'right' });

function formatDate(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

    // Save PDF
    doc.save('Invoice.pdf');
  }

  
}
