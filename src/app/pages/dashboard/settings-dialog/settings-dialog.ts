import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormField } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PdfSettingsService } from '../../../core/services/pdf-settings/pdf-settings';
import { MatAnchor } from "@angular/material/button";

@Component({
  selector: 'app-settings-dialog',
  imports: [MatDialogModule, MatFormField, MatInputModule, CommonModule, FormsModule, ReactiveFormsModule, MatAnchor],
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
})
export class SettingsDialog {
 form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SettingsDialog>,
    private settingsService: PdfSettingsService
  ) {
    const settings = this.settingsService.getSettings();

    this.form = this.fb.group({
      headingSize: [settings.headingSize],
      subHeadingSize: [settings.subHeadingSize],
      tableSize: [settings.tableSize],
      normalTextSize: [settings.normalTextSize]
    });
  }

  save() {
    this.settingsService.setSettings(this.form.value);
    this.dialogRef.close();
  }
}
