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
    const isTabSeparated = text.includes('\t');
    if (isTabSeparated) {
      return this.importMultiBillTsv(text);
    }
    return this.importSingleBillCsv(text);
  }

  private async importSingleBillCsv(text: string) {
    const lines = text.split('\n');
    let supplier = '';
    let invoiceNo = '';
    let invoiceDate = '';
    let totalAmount = 0;

    for (const line of lines) {
      const cols = line.split(',');
      if (cols[0] === 'H' && cols[1]?.trim() === 'Supplier') supplier = cols[2]?.trim();
      if (cols[0] === 'H' && cols[1]?.trim() === 'Inv.No.') invoiceNo = cols[2]?.trim();
      if (cols[0] === 'H' && cols[1]?.trim() === 'Inv. Date') invoiceDate = this.convertDDMMYYYYToISO(cols[2]?.trim());
      if (cols[0] === 'F') totalAmount = parseFloat(cols[2]);
    }

    const existing = await this.db.findByKey('purchaseInvoices', 'invoiceNo', invoiceNo);
    if (existing) throw new Error('Invoice already imported');

    const invoiceId = await this.db.add('purchaseInvoices', { supplier, invoiceNo, invoiceDate, totalAmount });

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

      const product = await this.db.saveIfNotExists('products', { code, name, packing, hsn }, 'code');

      await this.db.add('productBatches', {
        productId: product.id, batch, expiry,
        qty: quantity, freeQty: free, rate: sellingRate, mrp, invoiceId
      });
    }

    return true;
  }

  private async importMultiBillTsv(text: string) {
    const allLines = text.split('\n');
    const BILL_WIDTH = 6; // Type, Code, Name, Packing, Quantity, Free

    // Split into sections separated by empty lines
    const sections: string[][] = [];
    let currentSection: string[] = [];

    for (const line of allLines) {
      if (!line.trim()) {
        if (currentSection.length > 0) {
          sections.push(currentSection);
          currentSection = [];
        }
        continue;
      }
      currentSection.push(line);
    }
    if (currentSection.length > 0) sections.push(currentSection);

    // Collect all bills from all sections
    const allBills = new Map<string, {
      supplier: string; invoiceNo: string; invoiceDate: string;
      totalAmount: number;
      items: { code: string; name: string; packing: string; quantity: number; free: number }[];
    }>();

    for (const section of sections) {
      // Determine bill count from first line of this section
      const firstCols = section[0].split('\t');
      const billCount = Math.floor(firstCols.length / BILL_WIDTH);
      if (billCount === 0) continue;

      // Temp storage for this section's bills (by column index)
      const sectionBills = new Map<number, {
        supplier: string; invoiceNo: string; invoiceDate: string;
        totalAmount: number;
        items: { code: string; name: string; packing: string; quantity: number; free: number }[];
      }>();

      for (let i = 0; i < billCount; i++) {
        sectionBills.set(i, { supplier: '', invoiceNo: '', invoiceDate: '', totalAmount: 0, items: [] });
      }

      for (const line of section) {
        const cols = line.split('\t');

        for (let b = 0; b < billCount; b++) {
          const offset = b * BILL_WIDTH;
          const type = cols[offset]?.trim();
          const col1 = cols[offset + 1]?.trim() || '';
          const col2 = cols[offset + 2]?.trim() || '';
          const col3 = cols[offset + 3]?.trim() || '';
          const col4 = cols[offset + 4]?.trim() || '';
          const col5 = cols[offset + 5]?.trim() || '';

          if (!type || type === 'Type') continue;

          const bill = sectionBills.get(b)!;

          if (type === 'H') {
            if (col1 === 'Supplier') bill.supplier = col2;
            else if (col1 === 'Inv.No.') bill.invoiceNo = col2;
            else if (col1 === 'Inv. Date') bill.invoiceDate = this.convertDDMMYYYYToISO(col2);
          }

          if (type === 'D') {
            const quantity = Math.round(parseFloat(col4) || 0);
            const free = Math.round(parseFloat(col5) || 0);
            if (quantity <= 0 && free <= 0) continue;

            bill.items.push({ code: col1, name: col2, packing: col3, quantity, free });
          }

          if (type === 'F' && col1 === 'Bill Amount') {
            bill.totalAmount = parseFloat(col2) || 0;
          }
        }
      }

      // Merge into allBills by invoiceNo (avoid duplicates across sections)
      for (const [, bill] of sectionBills) {
        if (!bill.invoiceNo) continue;
        if (!allBills.has(bill.invoiceNo)) {
          allBills.set(bill.invoiceNo, bill);
        } else {
          // Same invoice in another section — merge items
          const existing = allBills.get(bill.invoiceNo)!;
          existing.items.push(...bill.items);
          if (bill.totalAmount > 0) existing.totalAmount = bill.totalAmount;
        }
      }
    }

    // Save all collected bills
    let imported = 0;
    let skipped = 0;

    for (const [, bill] of allBills) {
      if (bill.items.length === 0) { skipped++; continue; }

      const existing = await this.db.findByKey('purchaseInvoices', 'invoiceNo', bill.invoiceNo);
      if (existing) { skipped++; continue; }

      const invoiceId = await this.db.add('purchaseInvoices', {
        supplier: bill.supplier, invoiceNo: bill.invoiceNo,
        invoiceDate: bill.invoiceDate, totalAmount: bill.totalAmount
      });

      for (const item of bill.items) {
        const product = await this.db.saveIfNotExists(
          'products', { code: item.code, name: item.name, packing: item.packing }, 'code'
        );

        await this.db.add('productBatches', {
          productId: product.id, batch: '', expiry: '',
          qty: item.quantity, freeQty: item.free, rate: 0, mrp: 0, invoiceId
        });
      }

      imported++;
    }

    if (imported === 0 && skipped > 0) throw new Error('All invoices already imported');

    return { imported, skipped };
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
