import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {

private dbPromise = openDB('pharmacy-db', 3, {
  upgrade(db, oldVersion) {

    if (!db.objectStoreNames.contains('patients')) {
      const store = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
      store.createIndex('name', 'name', { unique: false });
    } else if (oldVersion < 3) {
      const tx = (db as any).transaction;
      const store = tx?.objectStore('patients');
      if (store && !store.indexNames.contains('name')) {
        store.createIndex('name', 'name', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains('doctors')) {
      const store = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
      store.createIndex('name', 'name', { unique: false });
    } else if (oldVersion < 3) {
      const tx = (db as any).transaction;
      const store = tx?.objectStore('doctors');
      if (store && !store.indexNames.contains('name')) {
        store.createIndex('name', 'name', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains('products')) {
      const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('code', 'code', { unique: false });
    } else if (oldVersion < 3) {
      const tx = (db as any).transaction;
      const store = tx?.objectStore('products');
      if (store && !store.indexNames.contains('name')) {
        store.createIndex('name', 'name', { unique: false });
      }
      if (store && !store.indexNames.contains('code')) {
        store.createIndex('code', 'code', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains('bills')) {
      db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
    }

    if (!db.objectStoreNames.contains('productBatches')) {
      const store = db.createObjectStore('productBatches', { keyPath: 'id', autoIncrement: true });
      store.createIndex('productId', 'productId', { unique: false });
    } else if (oldVersion < 3) {
      const tx = (db as any).transaction;
      const store = tx?.objectStore('productBatches');
      if (store && !store.indexNames.contains('productId')) {
        store.createIndex('productId', 'productId', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains('purchaseInvoices')) {
      const store = db.createObjectStore('purchaseInvoices', { keyPath: 'id', autoIncrement: true });
      store.createIndex('invoiceNo', 'invoiceNo', { unique: false });
    } else if (oldVersion < 3) {
      const tx = (db as any).transaction;
      const store = tx?.objectStore('purchaseInvoices');
      if (store && !store.indexNames.contains('invoiceNo')) {
        store.createIndex('invoiceNo', 'invoiceNo', { unique: false });
      }
    }

  }
});

  async getAll(store: string) {
    const db = await this.dbPromise;
    return db.getAll(store);
  }

  async add(store: string, data: any) {
    const db = await this.dbPromise;
    return db.add(store, data);
  }

  async saveIfNotExists(store: string, data: any, key: string) {
    const existing = await this.findByKey(store, key, data[key]);
    if (existing) return existing;

    const id = await this.add(store, data);
    return { ...data, id };
  }

  async update(store: string, data: any) {
    const db = await this.dbPromise;
    return db.put(store, data);
  }

  async getById(store: string, id: number) {
    const db = await this.dbPromise;
    return db.get(store, id);
  }

  async findByKey(storeName: string, key: string, value: any): Promise<any | null> {
    if (value === undefined || value === null) return null;
    const db = await this.dbPromise;
    try {
      const result = await db.getFromIndex(storeName, key, value);
      return result ?? null;
    } catch {
      const all = await this.getAll(storeName);
      return all.find(item => item[key] === value) ?? null;
    }
  }

  async exportAllRaw(): Promise<Record<string, any[]>> {
    const storeNames = ['patients', 'doctors', 'products', 'bills', 'productBatches', 'purchaseInvoices'];
    const data: Record<string, any[]> = {};
    for (const name of storeNames) {
      data[name] = await this.getAll(name);
    }
    return data;
  }

  async exportAll(): Promise<string> {
    return JSON.stringify(await this.exportAllRaw(), null, 2);
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    const storeNames = ['patients', 'doctors', 'products', 'bills', 'productBatches', 'purchaseInvoices'];
    for (const name of storeNames) {
      const tx = db.transaction(name, 'readwrite');
      await tx.objectStore(name).clear();
      await tx.done;
    }
  }

  async importAll(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    const db = await this.dbPromise;
    const storeNames = ['patients', 'doctors', 'products', 'bills', 'productBatches', 'purchaseInvoices'];

    for (const name of storeNames) {
      if (!data[name] || !Array.isArray(data[name])) continue;
      const tx = db.transaction(name, 'readwrite');
      const store = tx.objectStore(name);
      await store.clear();
      for (const item of data[name]) {
        await store.put(item);
      }
      await tx.done;
    }
  }

}
