import { Injectable, signal } from '@angular/core';
import { IndexedDbService } from './indexed-db';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { DataStoreService } from './data-store';

@Injectable({ providedIn: 'root' })
export class SyncCheckService {
  syncing = signal(false);
  syncMessage = signal('');
  private hasChecked = false;

  constructor(
    private db: IndexedDbService,
    private api: ApiService,
    private auth: AuthService,
    private store: DataStoreService,
  ) {
    this.auth.onLogout = () => this.reset();
  }

  async checkAndSync(): Promise<void> {
    // Only check once per session and only if logged in
    if (this.hasChecked || !this.auth.isLoggedIn()) return;
    this.hasChecked = true;

    try {
      this.syncing.set(true);
      this.syncMessage.set('Checking sync status...');

      // Get cloud status
      const cloudStatus = await this.api.syncStatus();
      const cloudCounts = cloudStatus.counts;

      // Get local counts from IndexedDB
      const localData = await this.db.exportAllRaw();
      const localCounts: Record<string, number> = {};
      for (const [key, items] of Object.entries(localData)) {
        localCounts[key] = items.length;
      }

      // Compare counts
      const cloudTotal = Object.values(cloudCounts).reduce((sum, c) => sum + c, 0);
      const localTotal = Object.values(localCounts).reduce((sum, c) => sum + c, 0);

      if (cloudTotal === 0 && localTotal === 0) {
        // Both empty, nothing to sync
        this.syncMessage.set('');
        this.syncing.set(false);
        return;
      }

      if (cloudTotal > 0 && localTotal === 0) {
        // Cloud has data but local is empty — pull from cloud
        this.syncMessage.set('Restoring data from cloud...');
        await this.restoreFromCloud();
        this.syncMessage.set('Data restored from cloud!');
      } else if (localTotal > 0 && cloudTotal === 0) {
        // Local has data but cloud is empty — push to cloud
        this.syncMessage.set('Syncing local data to cloud...');
        await this.pushToCloud();
        this.syncMessage.set('Data synced to cloud!');
      } else {
        // Both have data — check if counts differ
        const isOutOfSync = Object.keys(cloudCounts).some(
          key => (cloudCounts[key] || 0) !== (localCounts[key] || 0)
        );

        if (isOutOfSync) {
          // Cloud has different data — pull from cloud (cloud is source of truth when both have data)
          this.syncMessage.set('Syncing data...');
          // Push local first, then pull to merge
          await this.pushToCloud();
          this.syncMessage.set('Data synced!');
        }
      }
    } catch (err) {
      console.error('Sync check failed:', err);
      this.syncMessage.set('');
    } finally {
      this.syncing.set(false);
      // Clear message after a delay
      setTimeout(() => this.syncMessage.set(''), 3000);
    }
  }

  private async pushToCloud() {
    const data = await this.db.exportAllRaw();
    await this.api.syncPush(data);
  }

  private async restoreFromCloud() {
    const data = await this.api.syncPull();

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
  }

  /** Reset check so it runs again on next navigation (e.g. after re-login) */
  reset() {
    this.hasChecked = false;
  }
}
