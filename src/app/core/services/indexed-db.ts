import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {

  private dbPromise = openDB('pharmacy-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('doctors')) {
        db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('bills')) {
        db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
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
  const all = await this.getAll(storeName);
  return all.find(item => item[key] === value) ?? null;
}


}
