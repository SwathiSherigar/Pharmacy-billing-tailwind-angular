import { Component, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { DataStoreService } from '../../core/services/data-store';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-item-listing',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './item-listing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './item-listing.css',
})
export class ItemListing implements AfterViewInit {

  displayedColumns = ['name', 'batch', 'expiry', 'qty', 'mrp'];
  dataSource = new MatTableDataSource<any>([]);
  batches: any[] = [];
  searchTerm = '';
  selection = new SelectionModel<any>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private store: DataStoreService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.loadBatches();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  get activeBatches(): any[] {
    const now = new Date();
    return this.batches.filter(b => !b.returned && new Date(b.expiry) > now);
  }

  get totalBatches(): number {
    return this.activeBatches.length;
  }

  get uniqueProducts(): number {
    return new Set(this.activeBatches.map(b => b.name)).size;
  }

  get totalQty(): number {
    return this.activeBatches.reduce((sum, b) => sum + (b.qty || 0), 0);
  }

  activeFilter: 'all' | 'expiring' | 'expired' | 'returned' = 'all';

  get expiringSoonCount(): number {
    const now = new Date();
    const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    return this.batches.filter(b => {
      const exp = new Date(b.expiry);
      return exp > now && exp <= threeMonths && !b.returned;
    }).length;
  }

  get expiredCount(): number {
    const now = new Date();
    return this.batches.filter(b => new Date(b.expiry) <= now && !b.returned).length;
  }

  get returnedCount(): number {
    return this.batches.filter(b => b.returned).length;
  }

  get showSelectionColumn(): boolean {
    return this.activeFilter === 'expired';
  }

  private updateColumns() {
    if (this.showSelectionColumn) {
      this.displayedColumns = ['select', 'name', 'batch', 'expiry', 'qty', 'mrp'];
    } else {
      this.displayedColumns = ['name', 'batch', 'expiry', 'qty', 'mrp'];
    }
  }

  filterByExpiry(type: 'all' | 'expiring' | 'expired' | 'returned') {
    this.activeFilter = type;
    this.selection.clear();
    const now = new Date();
    const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

    if (type === 'expiring') {
      this.dataSource.data = this.batches.filter(b => {
        const exp = new Date(b.expiry);
        return exp > now && exp <= threeMonths && !b.returned;
      });
    } else if (type === 'expired') {
      this.dataSource.data = this.batches.filter(b => new Date(b.expiry) <= now && !b.returned);
    } else if (type === 'returned') {
      this.dataSource.data = this.batches.filter(b => b.returned);
    } else {
      this.dataSource.data = this.batches.filter(b => !b.returned);
    }

    this.updateColumns();
    this.cdr.markForCheck();
  }

  isAllSelected(): boolean {
    return this.selection.selected.length > 0 &&
      this.selection.selected.length === this.dataSource.filteredData.length;
  }

  isSomeSelected(): boolean {
    return this.selection.selected.length > 0 && !this.isAllSelected();
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach(row => this.selection.select(row));
    }
  }

  async markAsReturned() {
    const selected = this.selection.selected;
    if (selected.length === 0) return;

    const confirmed = confirm(`Mark ${selected.length} item(s) as returned?`);
    if (!confirmed) return;

    for (const batch of selected) {
      batch.returned = true;
      batch.returnedDate = new Date().toISOString();
      await this.store.updateBatch(batch);
    }

    this.selection.clear();
    this.filterByExpiry(this.activeFilter);
    this.cdr.markForCheck();
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  async loadBatches() {
    const allBatches = await this.store.getAllBatches();
    const products = await this.store.getAllProducts();

    this.batches = allBatches.map((batch: { productId: any }) => {
      const product = products.find((p: { id: any }) => p.id === batch.productId);
      return {
        ...batch,
        name: product?.name || ''
      };
    });

    this.dataSource.data = this.batches.filter(b => !b.returned);
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = `${data.name} ${data.batch} ${data.expiry}`.toLowerCase();
      return searchStr.includes(filter);
    };
    this.cdr.markForCheck();
  }

  async importFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    try {
      let text: string;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const allSheets: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
          allSheets.push(tsv);
        }
        text = allSheets.join('\n');
      } else {
        text = await file.text();
      }

      const result: any = await this.store.importPurchaseCsv(text);
      if (result?.imported !== undefined) {
        alert(`${result.imported} invoice(s) imported, ${result.skipped} skipped`);
      } else {
        alert('Import successful');
      }
      await this.loadBatches();
    } catch (err: any) {
      alert(err.message);
    }
  }
}
