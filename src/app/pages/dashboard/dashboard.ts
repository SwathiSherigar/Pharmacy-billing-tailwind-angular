import {
  Component,
  AfterViewInit,
  ViewChild,
  computed,
  effect
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DataStoreService } from '../../core/services/data-store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit {

  displayedColumns = ['patient', 'doctor', 'total', 'date'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  bills = computed(() => this.store.enrichedBills());

  constructor(
    private router: Router,
    public store: DataStoreService
  ) {
    effect(() => {
      this.dataSource.data = this.bills();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  goToBilling() {
    this.router.navigate(['/billing']);
  }

  formatDate(date: any) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}
