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
    const all = await this.getAll(store);
    if (!all.find((i: any) =>
      i[key]?.toLowerCase() === data[key]?.toLowerCase()
    )) {
      await this.add(store, data);
    }
  }
}
