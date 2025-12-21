import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AKASH PHARMA', pageWidth / 2, 12, { align: 'center' });

    // Patient Info
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('PATIENT INFORMATION', 10, 18);
    doc.text(`Name: ${data.patient.name}`, 10, 22);
    doc.text(`Phone: ${data.patient.phone || 'N/A'}`, 10, 26);
    doc.text(`Address: ${data.patient.address || 'N/A'}`, 10, 30);

    // Doctor Info
    doc.text("PRESCRIBING PHYSICIAN'S INFORMATION", 80, 18);
    doc.text(`Name: ${data.doctor.name}`, 80, 22);
    doc.text(`Phone: ${data.doctor.phone || 'N/A'}`, 80, 26);
    doc.text(`Address: ${data.doctor.address || 'N/A'}`, 80, 30);

    // Invoice Info (Single Line)
    const invoiceY = 34;
    const padding = 10;
    const maxWidth = pageWidth - 2 * padding;
    const colWidth = maxWidth / 4;

    doc.setFontSize(5);
    doc.text(`Invoice #: ${data.invoiceNo || 'N/A'}`, padding, invoiceY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, padding + colWidth, invoiceY);
    doc.text(`Due Date: ${data.dueDate || 'N/A'}`, padding + colWidth * 2, invoiceY);
    doc.text(`Amount Due: $${data.total.toFixed(2)}`, padding + colWidth * 3, invoiceY);

    // Items Table
    autoTable(doc, {
      startY: invoiceY + 4, // smaller margin between details and table
      head: [['Item Name', 'Batch', 'Rate', 'Qty', 'Expiry', 'MRP']],
      body: data.items.map(i => [
        i.name,
        i.batch || '',
        (i.rate || 0).toFixed(2),
        i.qty || 0,
        i.expiry || '',
        ((i.qty || 0) * (i.rate || 0)).toFixed(2)
      ]),
      theme: 'grid',
      styles: { fontSize: 5 }, // smaller font for many items
      headStyles: { fillColor: [220, 220, 220] },
      margin: { top: 0, bottom: 0, left: 5, right: 5 }
    });

    // Totals
    // Totals (RIGHT ALIGNED)
    const finalY = doc.lastAutoTable?.finalY || (invoiceY + 4);
    const taxRate = data.taxRate || 0;
    const taxAmount = data.total * (taxRate / 100);
    const grandTotal = data.total + taxAmount;

    const rightX = pageWidth - 8; // small right margin

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sub Total: $${data.total.toFixed(2)}`, rightX, finalY + 5, { align: 'right' });
    doc.text(`Tax Rate: ${taxRate}%`, rightX, finalY + 8, { align: 'right' });
    doc.text(`Tax: $${taxAmount.toFixed(2)}`, rightX, finalY + 11, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${grandTotal.toFixed(2)}`, rightX, finalY + 16, { align: 'right' });


    // Save PDF
    doc.save('Invoice.pdf');
  }
}
