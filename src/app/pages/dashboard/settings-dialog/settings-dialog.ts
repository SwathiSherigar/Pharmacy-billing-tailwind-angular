import { Component, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IndexedDbService } from '../../../core/services/indexed-db';
import { DataStoreService } from '../../../core/services/data-store';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings-dialog',
  imports: [MatDialogModule, CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
})
export class SettingsDialog {

  syncing = signal(false);
  syncMessage = signal('');

  constructor(
    private dialogRef: MatDialogRef<SettingsDialog>,
    private db: IndexedDbService,
    private store: DataStoreService,
    private api: ApiService,
    public auth: AuthService
  ) {}

  async syncToCloud() {
    this.syncing.set(true);
    this.syncMessage.set('');
    try {
      const data = await this.db.exportAllRaw();
      await this.api.syncPush(data);
      this.syncMessage.set('Data synced to cloud successfully!');
    } catch (err: any) {
      this.syncMessage.set(err.error?.message || 'Sync failed');
    }
    this.syncing.set(false);
  }

  async restoreFromCloud() {
    this.syncing.set(true);
    this.syncMessage.set('');
    try {
      const data = await this.api.syncPull();

      // Strip MongoDB fields before importing into IndexedDB
      const mongoFields = ['_id', 'clientId', 'localId', '__v', 'createdAt', 'updatedAt'];
      const cleaned: Record<string, any[]> = {};
      for (const [key, items] of Object.entries(data)) {
        if (!Array.isArray(items)) continue;
        cleaned[key] = items.map(item => {
          const clean = { ...item };
          for (const f of mongoFields) delete clean[f];
          return clean;
        });
      }

      await this.db.importAll(JSON.stringify(cleaned));
      await this.store.loadAll();
      this.syncMessage.set('Data restored from cloud successfully!');
    } catch (err: any) {
      this.syncMessage.set(err.error?.message || 'Restore failed');
    }
    this.syncing.set(false);
  }

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

  async clearAllData() {
    const confirmed = confirm('Are you sure you want to delete ALL data? This cannot be undone.');
    if (!confirmed) return;

    const doubleConfirm = confirm('This will permanently delete all patients, doctors, bills, products, batches and invoices. Continue?');
    if (!doubleConfirm) return;

    await this.db.clearAll();

    if (this.auth.isLoggedIn()) {
      try {
        await this.api.syncPurge();
      } catch {}
    }

    await this.store.loadAll();
    alert('All data has been deleted');
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
