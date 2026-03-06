import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule
  ],
  templateUrl: './item-listing.html',
  styleUrl: './item-listing.css',
})
export class ItemListing implements AfterViewInit {

  displayedColumns = ['name', 'batch', 'expiry', 'qty', 'rate', 'value'];
  dataSource = new MatTableDataSource<any>([]);
  batches: any[] = [];
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private store: DataStoreService,
    private dialog: MatDialog
  ) {
    this.loadBatches();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  get totalBatches(): number {
    return this.batches.length;
  }

  get uniqueProducts(): number {
    return new Set(this.batches.map(b => b.name)).size;
  }

  get totalQty(): number {
    return this.batches.reduce((sum, b) => sum + (b.qty || 0), 0);
  }

  get lowStockCount(): number {
    return this.batches.filter(b => b.qty <= 10).length;
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

    this.dataSource.data = this.batches;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = `${data.name} ${data.batch} ${data.expiry}`.toLowerCase();
      return searchStr.includes(filter);
    };
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
