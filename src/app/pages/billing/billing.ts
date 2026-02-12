import { Component, HostListener } from '@angular/core';
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
    Topbar
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomMonthYearAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }
  ],
  templateUrl: './billing.html',
})
export class BillingComponent {
  patient: any = {};
  doctor: any = {};
  items: any[] = [{ name: '', batch: '', qty: 1, rate: 0, expiry: '', mrp: 0 }];
  patients: any[] = [];
  doctors: any[] = [];
  products: any[] = [];
  filteredPatients: any[] = [];
  filteredDoctors: any[] = [];
  filteredItems: any[][] = [];


  displayedColumns = ['name', 'batch', 'qty', 'rate', 'expiry', 'mrp', 'delete'];
  isEditMode = false;
  editingBillId?: number;
  invoiceNo?: string;

  constructor(
    private db: IndexedDbService,
    private pdf: PdfService,
    private store: DataStoreService
  ) {
    this.loadData();
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

    this.items = bill.items.map((i: any) => ({
      ...i,
      mrp: i.qty * i.rate
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
    this.filteredItems[index] = this.products?.filter(p =>
      p.name.toLowerCase().includes(name)
    );
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
    const p = this.products.find(x => x.name === name);
    if (p) {
      this.items[index].name = p.name;
      // this.items[index].rate = p.rate;
      this.items[index].batch = p.batch;
    }
  }
  selectedMonth(date: Date, datepicker: any, item: any) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    item.expiry = `${month}/${year}`;
    datepicker.close();
  }




  async loadData() {
    this.patients = await this.db.getAll('patients');
    this.doctors = await this.db.getAll('doctors');
    this.products = await this.db.getAll('products');
  }

  calculate(item: any) {
    const base = item.qty * item.rate;
    // const gstAmount = base * (item.gst / 100);
    item.mrp = base;
  }


  get total() {
    return this.items.reduce((sum, i) => sum + i.mrp, 0);
  }

  async saveBill() {
    const toPlainObject = (obj: any) => JSON.parse(JSON.stringify(obj));
    const invoiceNo = this.isEditMode
      ? this.invoiceNo!       // ✅ keep same
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

    const bill = {
      invoiceNo,
      patientId: savedPatient.id,
      doctorId: savedDoctor.id,
      items: this.items.map(i => toPlainObject(i)),
      total: this.total,
      date: new Date(),
    };
    if (this.isEditMode) {
      await this.store.updateBill(bill);   // ✅ UPDATE
      alert('✅ Bill Updated');
    } else {
      await this.store.addBill(bill);      // ✅ NEW
      alert(`✅ Bill Saved (${bill.invoiceNo})`);
    }


    alert(`✅ Bill Saved (${invoiceNo})`);
    this.resetForm()
  }


  async printBill() {
    if (!this.patient.name || !this.doctor.name) {
      alert('❗ Patient and Doctor required');
      return;
    }
    const invoiceNo = this.isEditMode
      ? this.invoiceNo!       // ✅ keep same
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
    const bill = {
      invoiceNo,
      patientId: savedPatient.id,
      doctorId: savedDoctor.id,
      items: this.items.map(i => JSON.parse(JSON.stringify(i))),
      total: this.total,
      date: new Date()
    };

    if (this.isEditMode) {
      await this.store.updateBill(bill);  // ✅ update before print
    }
    else {
      await this.store.addBill(bill);
    }


    this.pdf.generateBill({
      invoiceNo,
      patient: savedPatient,
      doctor: savedDoctor,
      items: this.items,
      total: this.total
    });

    this.resetForm()
  }

  resetForm() {
    this.patient = {};
    this.doctor = {};

    this.items = [
      { name: '', batch: '', qty: 1, rate: 0, expiry: '', mrp: 0 }
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
    const newItem = { name: '', batch: '', qty: 1, rate: 0, expiry: '', mrp: 0 };


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

      // Support single object OR array
      const billsArray = Array.isArray(parsed) ? parsed : [parsed];

      let invoiceNumber = Number(await this.getNextInvoiceNumber());

      for (const data of billsArray) {

        if (!data.patient || !data.doctor || !data.items?.length) {
          console.warn('Invalid bill skipped', data);
          continue;
        }

        const toPlainObject = (obj: any) =>
          JSON.parse(JSON.stringify(obj));

        // Save patient
        const savedPatient = await this.store.saveOrGetPatient(
          toPlainObject(data.patient)
        );

        // Save doctor
        const savedDoctor = await this.store.saveOrGetDoctor(
          toPlainObject(data.doctor)
        );

        // Save products
        for (const item of data.items) {
          await this.db.saveIfNotExists(
            'products',
            toPlainObject(item),
            'name'
          );
        }

        const total = data.items.reduce(
          (sum: number, i: any) => sum + (i.qty * i.rate),
          0
        );

        const bill = {
          invoiceNo: String(invoiceNumber++),
          patientId: savedPatient.id,
          doctorId: savedDoctor.id,
          items: data.items.map((i: any) => ({
            ...i,
            mrp: i.qty * i.rate
          })),
          total,
          date: data.date ? new Date(data.date) : new Date()
        };

        await this.store.addBill(bill);
      }

      alert(`✅ ${billsArray.length} Bill(s) Imported Successfully`);

      this.jsonInput = '';
      this.showJsonBox = false;

      await this.store.loadAll();

    } catch (error) {
      alert('❌ Invalid JSON Format');
    }
  }



}
