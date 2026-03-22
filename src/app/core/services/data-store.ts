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
    return this.bills()
      .map(b => {
        // Bills now store patient/doctor inline
        const patient = b.patient;
        const doctor = b.doctor;

        // Support legacy bills that used patientId/doctorId
        if (!patient && b.patientId) {
          const patientMap = new Map(this.patients().map((p: any) => [p.id, p]));
          const doctorMap = new Map(this.doctors().map((d: any) => [d.id, d]));
          const legacyPatient = patientMap.get(b.patientId);
          if (!legacyPatient) return null;
          return {
            ...b,
            patient: legacyPatient,
            doctor: doctorMap.get(b.doctorId) || { name: 'N/A', phone: '', address: '' }
          };
        }

        if (!patient) return null;

        return {
          ...b,
          patient,
          doctor: doctor || { name: 'N/A', phone: '', address: '' }
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

  async updateBatch(batch: any) {
    await this.db.update('productBatches', batch);
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

      const packCount = this.parsePackingCount(packing);
      const perUnitMrp = packCount > 1 ? mrp / packCount : mrp;
      const totalQty = quantity * packCount;
      const totalFree = free * packCount;

      const product = await this.db.saveIfNotExists('products', { code, name, packing, hsn }, 'code');

      await this.db.add('productBatches', {
        productId: product.id, batch, expiry,
        qty: totalQty, freeQty: totalFree, rate: sellingRate, mrp: perUnitMrp, invoiceId
      });
    }

    return true;
  }

  /**
   * Detect bill column offsets by finding all "Type" headers in the first row.
   * Returns the starting column index for each bill.
   */
  private detectBillOffsets(headerCols: string[]): number[] {
    const offsets: number[] = [];
    for (let i = 0; i < headerCols.length; i++) {
      if (headerCols[i]?.trim() === 'Type') offsets.push(i);
    }
    return offsets;
  }

  /**
   * Build a column name map for a bill given its offset and the next bill's offset.
   * Maps header names like "Selling Rate", "MRP", "Batch No.", "Exp. Date", "Hsn" to their column index.
   */
  private buildColumnMap(headerCols: string[], startOffset: number, endOffset: number): Map<string, number> {
    const map = new Map<string, number>();
    for (let i = startOffset; i < endOffset; i++) {
      const name = headerCols[i]?.trim();
      if (name) map.set(name, i);
    }
    return map;
  }

  private async importMultiBillTsv(text: string) {
    const allLines = text.split('\n');

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

    // Collect all bills across all sections
    const allBills = new Map<string, {
      supplier: string; invoiceNo: string; invoiceDate: string;
      totalAmount: number;
      items: { code: string; name: string; packing: string; quantity: number; free: number;
               rate: number; mrp: number; batch: string; expiry: string; hsn: string }[];
    }>();

    for (const section of sections) {
      // Find header row (first row containing "Type")
      const headerLine = section.find(l => l.split('\t').some(c => c.trim() === 'Type'));
      if (!headerLine) continue;

      const headerCols = headerLine.split('\t');
      const offsets = this.detectBillOffsets(headerCols);
      if (offsets.length === 0) continue;

      // Build column maps for each bill
      const billMaps: { offset: number; colMap: Map<string, number> }[] = [];
      for (let i = 0; i < offsets.length; i++) {
        const end = i + 1 < offsets.length ? offsets[i + 1] : headerCols.length;
        billMaps.push({ offset: offsets[i], colMap: this.buildColumnMap(headerCols, offsets[i], end) });
      }

      // Init section bills
      const sectionBills = billMaps.map(() => ({
        supplier: '', invoiceNo: '', invoiceDate: '', totalAmount: 0,
        items: [] as { code: string; name: string; packing: string; quantity: number; free: number;
                       rate: number; mrp: number; batch: string; expiry: string; hsn: string }[]
      }));

      for (const line of section) {
        const cols = line.split('\t');

        for (let b = 0; b < billMaps.length; b++) {
          const { offset, colMap } = billMaps[b];
          const type = cols[offset]?.trim();
          if (!type || type === 'Type') continue;

          const bill = sectionBills[b];
          // Helper to get column value by header name
          const col = (name: string) => {
            const idx = colMap.get(name);
            return idx !== undefined ? cols[idx]?.trim() || '' : '';
          };

          if (type === 'H') {
            const label = col('Code');
            const value = col('Name');
            if (label === 'Supplier') bill.supplier = value;
            else if (label === 'Inv.No.') bill.invoiceNo = value;
            else if (label === 'Inv. Date') bill.invoiceDate = this.convertDDMMYYYYToISO(value);
          }

          if (type === 'D') {
            const quantity = Math.round(parseFloat(col('Quantity')) || 0);
            const free = Math.round(parseFloat(col('Free')) || 0);
            if (quantity <= 0 && free <= 0) continue;

            bill.items.push({
              code: col('Code'),
              name: col('Name'),
              packing: col('Packing'),
              quantity,
              free,
              rate: parseFloat(col('Selling Rate')) || 0,
              mrp: parseFloat(col('MRP')) || 0,
              batch: col('Batch No.'),
              expiry: this.convertMMYYYYToISO(col('Exp. Date')),
              hsn: col('Hsn') || col('HSN')
            });
          }

          if (type === 'F') {
            const label = col('Code');
            if (label === 'Bill Amount') {
              bill.totalAmount = parseFloat(col('Name')) || 0;
            }
          }
        }
      }

      // Merge into allBills by invoiceNo
      for (const bill of sectionBills) {
        if (!bill.invoiceNo) continue;
        if (!allBills.has(bill.invoiceNo)) {
          allBills.set(bill.invoiceNo, bill);
        } else {
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
          'products', { code: item.code, name: item.name, packing: item.packing, hsn: item.hsn }, 'code'
        );

        const packCount = this.parsePackingCount(item.packing);
        const perUnitMrp = packCount > 1 ? item.mrp / packCount : item.mrp;
        const totalQty = item.quantity * packCount;
        const totalFree = item.free * packCount;

        await this.db.add('productBatches', {
          productId: product.id, batch: item.batch, expiry: item.expiry,
          qty: totalQty, freeQty: totalFree, rate: item.rate, mrp: perUnitMrp, invoiceId
        });
      }

      imported++;
    }

    if (imported === 0 && skipped > 0) throw new Error('All invoices already imported');

    return { imported, skipped };
  }


  private parsePackingCount(packing: string): number {
    if (!packing) return 1;
    const match = packing.match(/(\d+)\s*[sS]$/);
    if (match) return parseInt(match[1]) || 1;
    const xMatch = packing.match(/\d+\s*[xX]\s*(\d+)/);
    if (xMatch) return parseInt(xMatch[1]) || 1;
    return 1;
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
