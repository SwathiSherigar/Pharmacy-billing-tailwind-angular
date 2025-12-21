import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IndexedDbService } from '../../core/services/indexed-db';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Topbar } from "../../shared/components/layout/topbar/topbar/topbar";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    Topbar,
    MatPaginatorModule
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit {

  displayedColumns = ['patient', 'doctor', 'total', 'date'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private db: IndexedDbService,
    private router: Router
  ) {
    this.loadBills();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadBills() {
    const data = await this.db.getAll('bills');
    data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    this.dataSource.data = data;
  }

  goToBilling() {
    this.router.navigate(['/billing']);
  }

  openBill(bill: any) {
    console.log('Open bill:', bill);
  }

  formatDate(date: any) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}
