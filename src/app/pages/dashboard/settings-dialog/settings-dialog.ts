import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { IndexedDbService } from '../../../core/services/indexed-db';
import { DataStoreService } from '../../../core/services/data-store';

@Component({
  selector: 'app-settings-dialog',
  imports: [MatDialogModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
})
export class SettingsDialog {

  constructor(
    private dialogRef: MatDialogRef<SettingsDialog>,
    private db: IndexedDbService,
    private store: DataStoreService
  ) {}

  async exportAsJson() {
    const json = await this.db.exportAll();
    this.downloadFile(json, 'application/json', `pharmacy-backup-${this.dateStamp()}.json`);
  }

  async exportAsExcel() {
    const XLSX = await import('xlsx');
    const rawData = await this.db.exportAllRaw();
    const wb = XLSX.utils.book_new();

    for (const [storeName, rows] of Object.entries(rawData) as [string, any[]][]) {
      if (!rows.length) continue;
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, storeName.slice(0, 31));
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy-backup-${this.dateStamp()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importData(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await this.db.importAll(text);
      await this.store.loadAll();
      alert('Data imported successfully');
    } catch {
      alert('Invalid backup file');
    }
    input.value = '';
  }

  private downloadFile(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
