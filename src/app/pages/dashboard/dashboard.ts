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
import { BillViewDialog } from './bill-view-dialog/bill-view-dialog';
import { MatDialog } from '@angular/material/dialog';

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
    public store: DataStoreService,
    private dialog: MatDialog
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

  viewBill(data:any){
    console.log(data)
       const dialogRef = this.dialog.open(BillViewDialog, {
         data: { ...data, type: 'patient' },
         width: '500px',
         maxHeight: '70vh',
         autoFocus: false,
         panelClass: 'dialog-wrapper',
       });
   
       dialogRef.afterClosed().subscribe(async updated => {
         if (updated) {
           await this.store.updatePatient(updated);
   
         }
       });
  }


  

}
