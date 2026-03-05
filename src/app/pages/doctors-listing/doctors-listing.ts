import {
  Component,
  ViewChild,
  AfterViewInit,
  computed,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DataStoreService } from '../../core/services/data-store';
import { EditDialog } from '../edit-dialog/edit-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-doctors-listing',
  standalone: true,
  imports: [
    FormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './doctors-listing.html',
  styleUrl: './doctors-listing.css',
})
export class DoctorsListing implements AfterViewInit {

  displayedColumns = ['name', 'phone', 'regNo', 'address', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  doctors = computed(() => this.store.doctors());

  constructor(
    public store: DataStoreService,
    private dialog: MatDialog
  ) {
    effect(() => {
      this.dataSource.data = this.doctors();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = `${data.name} ${data.phone} ${data.regNo} ${data.address}`.toLowerCase();
      return searchStr.includes(filter);
    };
  }

  get totalDoctors(): number {
    return this.doctors().length;
  }

  get registeredCount(): number {
    return this.doctors().filter((d: any) => d.regNo).length;
  }

  get withPhoneCount(): number {
    return this.doctors().filter((d: any) => d.phone).length;
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  editDoctor(doctor: any) {
    const dialogRef = this.dialog.open(EditDialog, {
      data: { ...doctor, type: 'doctor' },
      width: '26%',
      maxHeight: '70vh',
      autoFocus: false,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe(async updated => {
      if (updated) {
        await this.store.updateDoctor(updated);
      }
    });
  }
}
