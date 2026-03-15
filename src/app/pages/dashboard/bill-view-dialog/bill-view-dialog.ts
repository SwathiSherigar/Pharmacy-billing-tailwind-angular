import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { UpperCasePipe } from '@angular/common';
import { PdfService } from '../../../core/services/pdf.services';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bill-view-dialog',
  imports: [MatButtonModule, MatDialogModule, UpperCasePipe],
  templateUrl: './bill-view-dialog.html',
  styleUrl: './bill-view-dialog.css',
})
export class BillViewDialog {
  shopName: string;
  dlNo: string;
  shopPhone: string;
  shopAddress: string;
  shopEmail: string;

constructor(@Inject(MAT_DIALOG_DATA) public data: any, private pdf: PdfService, private dialogRef: MatDialogRef<BillViewDialog>, private auth: AuthService) {
  const client = this.auth.currentClient();
  this.shopName = client?.shopName || 'Pharmacy';
  this.dlNo = (client?.dlNo || '').split(',').map((s: string) => s.trim()).filter(Boolean).join('  |  ');
  this.shopPhone = client?.phone || '';
  this.shopAddress = client?.address || '';
  this.shopEmail = client?.email || '';
}

formatDate(date: string | Date): string {
  if (!date) return '';

  let billDate: Date;

  if (date instanceof Date) {
    billDate = date;
  } 
  else if (typeof date === 'string' && date.includes('T')) {
    billDate = new Date(date);
  } 
  else if (typeof date === 'string' && date.includes('/')) {
    return date;
  } 
  else {
    billDate = new Date(date);
  }

  if (isNaN(billDate.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(billDate.getDate())}/${pad(billDate.getMonth() + 1)}/${billDate.getFullYear()} ` +
         `${pad(billDate.getHours())}:${pad(billDate.getMinutes())}:${pad(billDate.getSeconds())}`;
}

  close(){
    this.dialogRef.close()
  }

   printBill() {
    this.pdf.generateBill({
      invoiceNo: this.data.invoiceNo,
      patient: this.data.patient,
      doctor: this.data.doctor,
      items: this.data.items,
      total: this.data.total,
       date: this.data.date
    });
  }

  editBill() {
    this.dialogRef.close({
      action: 'edit',
      bill: this.data
    });
  }
}
