import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bill-view-dialog',
  imports: [],
  templateUrl: './bill-view-dialog.html',
  styleUrl: './bill-view-dialog.css',
})
export class BillViewDialog {
constructor(@Inject(MAT_DIALOG_DATA) public data: any,  private dialogRef: MatDialogRef<BillViewDialog>) {}

  formatDate(date: any) {
    return new Date(date).toLocaleDateString('en-IN');
  }

  close(){
    this.dialogRef.close()
  }
}
