import { Component, Inject } from '@angular/core';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
@Component({
  selector: 'app-edit-dialog',
  imports: [MatDialogContent, MatDialogActions, FormsModule, MatInputModule, MatButtonModule, MatIconModule,MatDialogModule],
  templateUrl: './edit-dialog.html',
  styleUrl: './edit-dialog.css',
})
export class EditDialog {
 constructor(
    private dialogRef: MatDialogRef<EditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close(this.data);
  }
}
