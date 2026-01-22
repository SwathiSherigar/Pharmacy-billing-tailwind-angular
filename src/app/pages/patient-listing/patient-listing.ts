import {
  Component,
  ViewChild,
  AfterViewInit,
  computed,
  effect
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DataStoreService } from '../../core/services/data-store';
import { EditDialog } from '../edit-dialog/edit-dialog';
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-patient-listing',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatIconModule, MatMenuModule],
  templateUrl: './patient-listing.html',
  styleUrl: './patient-listing.css',
})
export class PatientListing implements AfterViewInit {

  displayedColumns = ['name', 'phone', 'age', 'address', 'action'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
