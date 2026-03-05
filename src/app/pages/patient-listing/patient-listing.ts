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
  selector: 'app-patient-listing',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './patient-listing.html',
  styleUrl: './patient-listing.css',
})
export class PatientListing implements AfterViewInit {

  displayedColumns = ['name', 'phone', 'age', 'address', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  patients = computed(() => this.store.patients());

  constructor(
    private dialog: MatDialog,
    public store: DataStoreService
  ) {
    effect(() => {
      this.dataSource.data = this.patients();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = `${data.name} ${data.phone} ${data.address}`.toLowerCase();
      return searchStr.includes(filter);
    };
  }

  get totalPatients(): number {
    return this.patients().length;
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  editPatient(patient: any) {
    const dialogRef = this.dialog.open(EditDialog, {
      data: { ...patient, type: 'patient' },
      width: '26%',
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
