import { Injectable, signal, computed, effect } from '@angular/core';
import { IndexedDbService } from './indexed-db';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  patients = signal<any[]>([]);
  doctors = signal<any[]>([]);
  bills = signal<any[]>([]);

  constructor(private db: IndexedDbService) {
    this.loadAll();
  }

  async loadAll() {
    this.patients.set(await this.db.getAll('patients'));
    this.doctors.set(await this.db.getAll('doctors'));
    this.bills.set(await this.db.getAll('bills'));
  }

  async updatePatient(patient: any) {
    await this.db.update('patients', patient);
    this.patients.update(p =>
      p.map(x => x.id === patient.id ? patient : x)
    );
  }

  async updateDoctor(doctor: any) {
    await this.db.update('doctors', doctor);
    this.doctors.update(d =>
      d.map(x => x.id === doctor.id ? doctor : x)
    );
  }

  async addBill(bill: any) {
    const id = await this.db.add('bills', bill);
    this.bills.update(b => [...b, { ...bill, id }]);
  }
  async updateBill(bill: any) {
    if (!bill.id) {
      throw new Error('Bill ID is required for update');
    }

    await this.db.update('bills', bill);

    this.bills.update(b =>
      b.map(x => x.id === bill.id ? bill : x)
    );
  }

  enrichedBills = computed(() => {
    const patientMap = new Map(
      this.patients().map(p => [p.id, p])
    );
    const doctorMap = new Map(
      this.doctors().map(d => [d.id, d])
    );

    return this.bills()
      .map(b => {
        const patient = patientMap.get(b.patientId);
        const doctor = doctorMap.get(b.doctorId);

        if (!patient || !doctor) return null;

        return {
          ...b,
          patient,
          doctor
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  });


  async saveOrGetPatient(patient: any) {
    const saved = await this.db.saveIfNotExists('patients', patient, 'name');

    this.patients.update(p =>
      p.some(x => x.id === saved.id) ? p : [...p, saved]
    );

    return saved;
  }

  async saveOrGetDoctor(doctor: any) {
    const saved = await this.db.saveIfNotExists('doctors', doctor, 'name');

    this.doctors.update(d =>
      d.some(x => x.id === saved.id) ? d : [...d, saved]
    );

    return saved;
  }

  async getAllBatches() {
    return await this.db.getAll('productBatches');
  }

  async deductInventory(items: any[]) {
    for (const item of items) {
      if (!item.batchId) continue;
      const batch = await this.db.getById('productBatches', item.batchId);
      if (!batch) continue;
      batch.qty = Math.max(0, batch.qty - item.qty);
      await this.db.update('productBatches', batch);
    }
  }

  async getAllProducts() {
    return await this.db.getAll('products');
  }
  
  async importPurchaseCsv(text: string) {

    const lines = text.split('\n');

    let supplier = '';
    let invoiceNo = '';
    let invoiceDate = '';
    let totalAmount = 0;

    // Extract header
    for (const line of lines) {
      const cols = line.split(',');

      if (cols[0] === 'H' && cols[1]?.trim() === 'Supplier') {
        supplier = cols[2]?.trim();
      }

      if (cols[0] === 'H' && cols[1]?.trim() === 'Inv.No.') {
        invoiceNo = cols[2]?.trim();
      }

      if (cols[0] === 'H' && cols[1]?.trim() === 'Inv. Date') {
        invoiceDate = this.convertDDMMYYYYToISO(cols[2]?.trim());
      }
      if (cols[0] === 'F') {
        totalAmount = parseFloat(cols[2]);
      }
    }

    // Duplicate check
    const existing = await this.db.findByKey(
      'purchaseInvoices',
      'invoiceNo',
      invoiceNo
    );

    if (existing) {
      throw new Error('Invoice already imported');
    }

    // Save invoice
    const invoiceId = await this.db.add('purchaseInvoices', {
      supplier,
      invoiceNo,
      invoiceDate,
      totalAmount
    });

    // Process D rows
    for (const line of lines) {

      const cols = line.split(',');
      if (cols[0] !== 'D') continue;

      const code = cols[1]?.trim();
      const name = cols[2]?.trim();
      const packing = cols[3]?.trim();
      const quantity = parseInt(cols[4]);
      const free = parseInt(cols[5]);
      const sellingRate = parseFloat(cols[6]);
      const mrp = parseFloat(cols[7]);
      const batch = cols[8]?.trim();
      const expiry = this.convertMMYYYYToISO(cols[9]?.trim());
      const hsn = cols[17]?.trim();

      const product = await this.db.saveIfNotExists(
        'products',
        { code, name, packing, hsn },
        'code'
      );

      await this.db.add('productBatches', {
        productId: product.id,
        batch,
        expiry,
        qty: quantity,
        freeQty: free,
        rate: sellingRate,
        mrp,
        invoiceId
      });
    }

    return true;
  }


  private convertDDMMYYYYToISO(dateStr: string): string {
    if (!dateStr) return '';

    const [day, month, year] = dateStr.split('/');
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return date.toISOString();
  }

  private convertMMYYYYToISO(dateStr: string): string {
    if (!dateStr) return '';

    const [month, year] = dateStr.split('/');
    const date = new Date(
      Number(year),
      Number(month) - 1,
      1
    );

    return date.toISOString();
  }

}
