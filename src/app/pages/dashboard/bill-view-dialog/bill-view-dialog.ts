import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfService } from '../../../core/services/pdf.services';

@Component({
  selector: 'app-bill-view-dialog',
  imports: [],
  templateUrl: './bill-view-dialog.html',
  styleUrl: './bill-view-dialog.css',
})
export class BillViewDialog {
constructor(@Inject(MAT_DIALOG_DATA) public data: any, private pdf: PdfService,  private dialogRef: MatDialogRef<BillViewDialog>) {}

  formatDate(date: string | Date): string {
  const billDate = new Date(date);

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
