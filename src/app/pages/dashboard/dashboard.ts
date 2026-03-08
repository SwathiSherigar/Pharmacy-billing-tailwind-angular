import {
  Component,
  AfterViewInit,
  ViewChild,
  computed,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DataStoreService } from '../../core/services/data-store';
import { BillViewDialog } from './bill-view-dialog/bill-view-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialog } from './settings-dialog/settings-dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {

  displayedColumns = ['invoiceNo', 'patient', 'doctor', 'total', 'date', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  bills = computed(() => this.store.enrichedBills());

  totalBills = computed(() => this.bills().length);

  totalRevenue = computed(() =>
    this.bills().reduce((sum: number, b: any) => sum + (b.total || 0), 0)
  );

  uniquePatients = computed(() =>
    new Set(this.bills().map((b: any) => b.patient?.name)).size
  );

  todayBills = computed(() => {
    const today = new Date();
    return this.bills().filter((b: any) => {
      const d = new Date(b.date);
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    }).length;
  });

  constructor(
    private router: Router,
    public store: DataStoreService,
    private dialog: MatDialog
  ) {
    effect(() => {
      this.dataSource.data = this.bills();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'patient': return item.patient?.name || '';
        case 'doctor': return item.doctor?.name || '';
        case 'date': return new Date(item.date).getTime();
        default: return item[property];
      }
    };
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = `${data.invoiceNo} ${data.patient?.name} ${data.doctor?.name}`.toLowerCase();
      return searchStr.includes(filter);
    };
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  goToBilling() {
    this.router.navigate(['/billing']);
  }

  formatDate(date: any) {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  viewBill(data: any) {
    const dialogRef = this.dialog.open(BillViewDialog, {
      data: { ...data, type: 'patient' },
      width: '95vw',
      maxWidth: '700px',
      maxHeight: '85vh',
      autoFocus: false,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe(async updated => {
      if (updated?.action === 'edit') {
        this.editBill(updated.bill);
      }
    });
  }

  editBill(bill: any) {
    this.router.navigate(['/billing'], {
      state: { mode: 'edit', bill }
    });
  }

  openSettings() {
    this.dialog.open(SettingsDialog, { width: '95vw', maxWidth: '400px' });
  }
}
