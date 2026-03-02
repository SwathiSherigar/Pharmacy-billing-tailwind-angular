import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { DataStoreService } from '../../core/services/data-store';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-item-listing',
  standalone: true,
  imports: [
    MatIconModule,
    MatTableModule,
    MatPaginator,
    MatButtonModule
  ],
  templateUrl: './item-listing.html',
  styleUrl: './item-listing.css',
})
export class ItemListing implements AfterViewInit {

  displayedColumns = ['batch', 'expiry', 'name', 'qty', 'rate'];
  dataSource = new MatTableDataSource<any>([]);
  batches: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private store: DataStoreService,
    private dialog: MatDialog
  ) {
    this.loadBatches();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  // ✅ Load all batches and join product name
  async loadBatches() {
    const allBatches = await this.store.getAllBatches();
    const products = await this.store.getAllProducts();

    this.batches = allBatches.map((batch: { productId: any; }) => {
      const product = products.find((p: { id: any; }) => p.id === batch.productId);
      return {
        ...batch,
        name: product?.name || ''
      };
    });

    this.dataSource.data = this.batches;
  }
async importCsv(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();

  try {
    await this.store.importPurchaseCsv(text);
    alert('Import successful');
    await this.loadBatches();
  } catch (err: any) {
    alert(err.message);
  }
}

}