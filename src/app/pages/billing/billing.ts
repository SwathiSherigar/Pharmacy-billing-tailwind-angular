import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { IndexedDbService } from '../../core/services/indexed-db';
import { PdfService } from '../../core/services/pdf.services';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
 import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { CustomDateAdapter } from '../../adapters/CustomNgxDatetimeAdapter';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
}


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
    MatOptionModule

  ],
   providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
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

  constructor(
    private db: IndexedDbService,
    private pdf: PdfService
  ) {
    this.loadData();
  }

  allowOnlyNumbers(e: KeyboardEvent) {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  filterPatients() {
    const name = this.patient.name?.toLowerCase() || '';
    this.filteredPatients = this.patients.filter(p =>
      p.name.toLowerCase().includes(name)
    );
  }
  filterDoctors() {
    const name = this.doctor.name?.toLowerCase() || '';
    this.filteredDoctors = this.doctors.filter(d =>
      d.name.toLowerCase().includes(name)
    );
  }
  filterItems(index: number) {
    const name = this.items[index].name?.toLowerCase() || '';
    this.filteredItems[index] = this.products.filter(p =>
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
      this.items[index].rate = p.rate;
      this.items[index].batch = p.batch;
    }
  }


  async loadData() {
    this.patients = await this.db.getAll('patients');
    this.doctors = await this.db.getAll('doctors');
    this.products = await this.db.getAll('products');
  }

  calculate(item: any) {
    item.mrp = item.qty * item.rate;
  }

  get total() {
    return this.items.reduce((sum, i) => sum + i.mrp, 0);
  }

  async saveBill() {
    await this.db.saveIfNotExists('patients', this.patient, 'name');
    await this.db.saveIfNotExists('doctors', this.doctor, 'name');

    for (const item of this.items) {
      await this.db.saveIfNotExists('products', item, 'name');
    }

    const bill = {
      patient: this.patient,
      doctor: this.doctor,
      items: this.items,
      total: this.total,
      date: new Date(),
    };

    await this.db.add('bills', bill);
  }


  printBill() {
    if (!this.patient.name) {
      alert("❗ Patient name required");
      return;
    }

    if (!this.patient.phone || this.patient.phone.length !== 10) {
      alert("❗ Patient phone must be 10 digits");
      return;
    }

    if (!this.doctor.name) {
      alert("❗ Doctor name required");
      return;
    }

    for (const i of this.items) {
      if (!i.name || !i.batch || !i.qty || !i.rate || !i.expiry) {
        alert("❗ All item fields are required");
        return;
      }
    }
    this.pdf.generateBill({
      patient: this.patient,
      doctor: this.doctor,
      items: this.items,
      total: this.total,
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeys(e: KeyboardEvent) {
    if (e.key === 'F9') this.saveBill();
    if (e.key === 'F10') this.printBill();
    if (e.key === 'F4') this.addRow();
  }
  onItemKeydown(event: KeyboardEvent, rowIndex: number) {

    // For Windows: ctrlKey, For Mac: metaKey (Command key)
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isCtrlOrCmd && event.key === 'Enter') {
      event.preventDefault();
      this.addRow(); // Add row **after the current row**
    }

  }


  addRow() {
    const newItem = { name: '', batch: '', qty: 1, rate: 0, expiry: '', mrp: 0 };


    // Add new row
    this.items = [...this.items, newItem];

    // Focus first cell of new row
    setTimeout(() => {
      const inputs = document.querySelectorAll('table input[matInput]');
      (inputs[inputs.length - 5] as HTMLElement)?.focus();
    });
  }

  deleteRow(index: number) {
    this.items.splice(index, 1);
    this.items = [...this.items]; // Refresh binding
  }

}
