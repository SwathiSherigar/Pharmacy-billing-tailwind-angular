import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { PdfService } from '../../core/services/pdf.services';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { Topbar } from "../../shared/components/layout/topbar/topbar";
import { CustomMonthYearAdapter } from '../../adapters/CustomNgxDatetimeAdapter';
import { DataStoreService } from '../../core/services/data-store';
import { IndexedDbService } from '../../core/services/indexed-db';
import { MatDialog } from '@angular/material/dialog';
import { BatchAllocationDialog, BatchAllocationData, BatchAllocationResult } from './batch-allocation-dialog/batch-allocation-dialog';
const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'MM/YYYY' },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};


@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatOptionModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomMonthYearAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.html',
  styleUrl: './billing.css',
})
export class BillingComponent {
  patient: any = {};
  doctor: any = {};
  billDate: Date = new Date();
  items: any[] = [{ name: '', batch: '', qty: 1, mrp: 0, expiry: '', amount: 0 }];
  patients: any[] = [];
  doctors: any[] = [];
  products: any[] = [];
  productBatches: any[] = [];
  filteredPatients: any[] = [];
  filteredDoctors: any[] = [];
  filteredItems: any[][] = [];


  displayedColumns = ['name', 'batch', 'qty', 'mrp', 'expiry', 'amount', 'delete'];
  isEditMode = false;
  editingBillId?: number;
  invoiceNo?: string;

  constructor(
    private db: IndexedDbService,
    private pdf: PdfService,
    private store: DataStoreService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.loadData();
  }

  get billTimeString(): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(this.billDate.getHours())}:${pad(this.billDate.getMinutes())}`;
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const newDate = input.valueAsDate;
    if (!newDate) return;
    newDate.setHours(this.billDate.getHours(), this.billDate.getMinutes(), this.billDate.getSeconds());
    this.billDate = newDate;
  }

  onTimeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const [hours, minutes] = input.value.split(':').map(Number);
    const updated = new Date(this.billDate);
    updated.setHours(hours, minutes);
    this.billDate = updated;
  }

  allowOnlyNumbers(e: KeyboardEvent) {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }
  ngOnInit() {
    const nav = history.state;

    if (nav?.mode === 'edit' && nav?.bill) {
      this.isEditMode = true;
      this.loadBillForEdit(nav.bill);
    }
  }

  loadBillForEdit(bill: any) {
    this.editingBillId = bill.id;
    this.invoiceNo = bill.invoiceNo;

    this.patient = { ...bill.patient };
    this.doctor = { ...bill.doctor };
    this.billDate = bill.date ? new Date(bill.date) : new Date();

    this.items = bill.items.map((i: any) => ({
      ...i,
      amount: i.qty * i.mrp
    }));
  }


  convertToDate(value: string | null): Date | null {
    if (!value) return null;
    const [month, year] = value.split('/');
    return new Date(+year, +month - 1, 1);
  }

  filterPatients() {
    const name = this.patient.name?.toLowerCase() || '';
    this.filteredPatients = this.patients?.filter(p =>
      p.name.toLowerCase().includes(name)
    );
  }
  filterDoctors() {
    const name = this.doctor.name?.toLowerCase() || '';
    this.filteredDoctors = this.doctors?.filter(d =>
      d.name.toLowerCase().includes(name)
    );
  }

  filterItems(index: number) {
    const name = this.items[index].name?.toLowerCase() || '';
    const seen = new Set<string>();
    this.filteredItems[index] = this.products
      ?.filter((p: any) => {
        const pName = p.name?.toLowerCase();
        if (!pName || !pName.includes(name) || seen.has(pName)) return false;
        seen.add(pName);
        return true;
      })
      .map((p: any) => {
        if (p.code) {
          const batches = this.getBatchesForProduct(p.id);
          const totalStock = batches.reduce((sum: number, b: any) => sum + (b.qty || 0), 0);
          return { ...p, totalStock };
        }
        return p;
      });
  }

  selectPatient(name: string) {
    const p = this.patients.find(x => x.name === name);
    if (p) this.patient = { ...p };
  }
  selectDoctor(name: string) {
    const d = this.doctors.find(x => x.name === name);
    if (d) this.doctor = { ...d };
  }

  selectItem(name: string, index: number) {
    // Prefer inventory product (has code field) over billing-saved product
    const inventoryProduct = this.products.find((x: any) => x.name === name && x.code);
    const product = inventoryProduct || this.products.find((x: any) => x.name === name);
    if (!product) return;

    if (product.code) {
      // Inventory product — load batch data
      const batches = this.getBatchesForProduct(product.id);
      this.items[index].name = product.name;
      this.items[index].productId = product.id;

      if (batches.length > 0) {
        const batch = batches[0]; // First batch sorted by expiry (FIFO)
        this.items[index].batch = batch.batch;
        this.items[index].mrp = batch.mrp;
        this.items[index].expiry = this.formatExpiryFromISO(batch.expiry);
        this.items[index].availableQty = batch.qty;
        this.items[index].batchId = batch.id;
        this.calculate(this.items[index]);
      }
    } else {
      // Non-inventory product — old behavior
      this.items[index].name = product.name;
      this.items[index].batch = product.batch || '';
    }
  }

  selectedMonth(date: Date, datepicker: any, item: any) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    item.expiry = `${month}/${year}`;
    datepicker.close();
  }

  // --- Inventory helpers ---

  getBatchesForProduct(productId: number): any[] {
    return this.productBatches
      .filter((b: any) => b.productId === productId && b.qty > 0)
      .sort((a: any, b: any) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  }

  formatExpiryFromISO(isoDate: string): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  onQtyBlur(item: any, index: number) {
    if (!item.productId) return;

    // Only open allocation dialog when qty exceeds current batch stock
    if (!item.availableQty || item.qty <= item.availableQty) return;

    const batches = this.getBatchesForProduct(item.productId);
    if (batches.length <= 1) return;

    // Open batch allocation dialog
    const dialogRef = this.dialog.open(BatchAllocationDialog, {
      width: '700px',
      disableClose: true,
      data: {
        productName: item.name,
        requestedQty: item.qty,
        batches: batches.map(b => ({
          id: b.id,
          batch: b.batch,
          expiry: b.expiry,
          mrp: b.mrp,
          qty: b.qty,
        })),
      } as BatchAllocationData,
    });

    dialogRef.afterClosed().subscribe((result: BatchAllocationResult | null) => {
      if (!result) return;

      const newItems: any[] = result.allocated.map(r => ({
        name: item.name,
        productId: item.productId,
        batch: r.batch,
        qty: r.allocate,
        mrp: r.mrp,
        expiry: this.formatExpiryFromISO(r.expiry),
        amount: r.allocate * r.mrp,
        availableQty: r.available,
        batchId: r.batchId,
      }));

      // Unfulfilled qty → separate row without batch
      if (result.unfulfilled > 0) {
        const fallbackMrp = newItems.length > 0
          ? newItems[newItems.length - 1].mrp
          : item.mrp;
        newItems.push({
          name: item.name,
          productId: item.productId,
          batch: '',
          qty: result.unfulfilled,
          mrp: fallbackMrp,
          expiry: '',
          amount: result.unfulfilled * fallbackMrp,
        });
      }

      if (newItems.length > 0) {
        this.items.splice(index, 1, ...newItems);
        this.items = [...this.items];
        this.cdr.detectChanges();
      }
    });
  }

  // --- Data loading ---

  async loadData() {
    this.patients = await this.db.getAll('patients');
    this.doctors = await this.db.getAll('doctors');
    this.products = await this.db.getAll('products');
    this.productBatches = await this.store.getAllBatches();
  }

  calculate(item: any) {
    const base = item.qty * item.mrp;
    item.amount = base;
  }


  get total() {
    return this.items.reduce((sum, i) => sum + i.amount, 0);
  }

  async saveBill() {
    const toPlainObject = (obj: any) => JSON.parse(JSON.stringify(obj));
    const invoiceNo = this.isEditMode
      ? this.invoiceNo!
      : await this.getNextInvoiceNumber();
    const savedPatient = await this.store.saveOrGetPatient(
      toPlainObject(this.patient)
    );

    const savedDoctor = await this.store.saveOrGetDoctor(
      toPlainObject(this.doctor)
    );

    for (const item of this.items) {
      await this.db.saveIfNotExists(
        'products',
        toPlainObject(item),
        'name'
      );
    }

    const bill: any = {
      invoiceNo,
      patientId: savedPatient.id,
      doctorId: savedDoctor.id,
      items: this.items.map(i => toPlainObject(i)),
      total: this.total,
      date: this.billDate,
    };
    if (this.isEditMode) {
      bill.id = this.editingBillId;
      await this.store.updateBill(bill);
      alert('Bill Updated');
    } else {
      await this.store.addBill(bill);
      alert(`Bill Saved (${bill.invoiceNo})`);
    }

    await this.store.deductInventory(this.items);
    this.productBatches = await this.store.getAllBatches();

    this.resetForm()
  }


  async printBill() {
    if (!this.patient.name || !this.doctor.name) {
      alert('Patient and Doctor required');
      return;
    }
    const invoiceNo = this.isEditMode
      ? this.invoiceNo!
      : await this.getNextInvoiceNumber();


    const savedPatient = await this.store.saveOrGetPatient(
      JSON.parse(JSON.stringify(this.patient))
    );

    const savedDoctor = await this.store.saveOrGetDoctor(
      JSON.parse(JSON.stringify(this.doctor))
    );
    for (const item of this.items) {
      await this.db.saveIfNotExists(
        'products',
        JSON.parse(JSON.stringify(item)),
        'name'
      );
    }
    const bill: any = {
      invoiceNo,
      patientId: savedPatient.id,
      doctorId: savedDoctor.id,
      items: this.items.map(i => JSON.parse(JSON.stringify(i))),
      total: this.total,
      date: this.billDate
    };

    if (this.isEditMode) {
      bill.id = this.editingBillId;
      await this.store.updateBill(bill);
    }
    else {
      await this.store.addBill(bill);
    }

    await this.store.deductInventory(this.items);
    this.productBatches = await this.store.getAllBatches();

    this.pdf.generateBill({
      invoiceNo,
      patient: savedPatient,
      doctor: savedDoctor,
      items: this.items,
      total: this.total,
      date: this.billDate
    });

    this.resetForm()
  }

  resetForm() {
    this.patient = {};
    this.doctor = {};
    this.billDate = new Date();

    this.items = [
      { name: '', batch: '', qty: 1, mrp: 0, expiry: '', amount: 0 }
    ];

    this.filteredPatients = [];
    this.filteredDoctors = [];
    this.filteredItems = [];

    setTimeout(() => {
      const firstInput = document.querySelector(
        'input[matInput]'
      ) as HTMLElement;
      firstInput?.focus();
    });
  }


  @HostListener('window:keydown', ['$event'])
  handleKeys(e: KeyboardEvent) {
    if (e.key === 'F9') this.saveBill();
    if (e.key === 'F10') this.printBill();
    if (e.key === 'F4') this.addRow();
  }
  onItemKeydown(event: KeyboardEvent, rowIndex: number) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isCtrlOrCmd && event.key === 'Enter') {
      event.preventDefault();
      this.addRow();
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    const bills = await this.db.getAll('bills');

    const numbers = bills
      .map(b => Number(b?.invoiceNo))
      .filter(n => !isNaN(n));

    if (!numbers.length) {
      return '1';
    }

    const max = Math.max(...numbers);
    return String(max + 1);
  }


  addRow() {
    const newItem = { name: '', batch: '', qty: 1, mrp: 0, expiry: '', amount: 0 };

    this.items = [...this.items, newItem];
    setTimeout(() => {
      const inputs = document.querySelectorAll('table input[matInput]');
      (inputs[inputs.length - 5] as HTMLElement)?.focus();
    });
  }

  deleteRow(index: number) {
    this.items.splice(index, 1);
    this.items = [...this.items];
  }

  showJsonBox = false;
  jsonInput: string = '';
  toggleJsonBox() {
    this.showJsonBox = !this.showJsonBox;
  }

  async importJson() {
    try {
      const parsed = JSON.parse(this.jsonInput);

      const billsArray = Array.isArray(parsed) ? parsed : [parsed];

      let invoiceNumber = Number(await this.getNextInvoiceNumber());

      for (const data of billsArray) {

        if (!data.patient || !data.doctor || !data.items?.length) {
          console.warn('Invalid bill skipped', data);
          continue;
        }

        const toPlainObject = (obj: any) =>
          JSON.parse(JSON.stringify(obj));

        const savedPatient = await this.store.saveOrGetPatient(
          toPlainObject(data.patient)
        );

        const savedDoctor = await this.store.saveOrGetDoctor(
          toPlainObject(data.doctor)
        );

        for (const item of data.items) {
          await this.db.saveIfNotExists(
            'products',
            toPlainObject(item),
            'name'
          );
        }

        const total = data.items.reduce(
          (sum: number, i: any) => sum + (i.qty * i.mrp),
          0
        );

        const bill = {
          invoiceNo: String(invoiceNumber++),
          patientId: savedPatient.id,
          doctorId: savedDoctor.id,
          items: data.items.map((i: any) => ({
            ...i,
            amount: i.qty * i.mrp
          })),
          total,
          date: data.date ? new Date(data.date) : new Date()
        };

        await this.store.addBill(bill);
      }

      alert(`${billsArray.length} Bill(s) Imported Successfully`);

      this.jsonInput = '';
      this.showJsonBox = false;

      await this.store.loadAll();

    } catch (error) {
      alert('Invalid JSON Format');
    }
  }

}
