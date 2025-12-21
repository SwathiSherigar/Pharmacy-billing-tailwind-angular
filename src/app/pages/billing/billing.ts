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
    MatTooltipModule  
  ],
  templateUrl: './billing.html',
})
export class BillingComponent {
  patient: any = {};
  doctor: any = {};
  items: any[] = [{ name: '', batch: '', qty: 1, rate: 0, mrp: 0 }];
  patients: any[] = [];
  doctors: any[] = [];
  products: any[] = [];

  displayedColumns = ['name', 'batch', 'qty', 'rate', 'mrp', 'delete'];

  constructor(
    private db: IndexedDbService,
    private pdf: PdfService
  ) {
    this.loadData();
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
    const newItem = { name: '', batch: '', qty: 1, rate: 0, mrp: 0 };

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
