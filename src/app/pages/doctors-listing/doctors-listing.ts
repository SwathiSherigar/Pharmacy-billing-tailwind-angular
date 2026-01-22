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
import { MatMenuModule } from "@angular/material/menu";

@Component({
  selector: 'app-doctors-listing',
  standalone: true,
  imports: [MatPaginatorModule, MatTableModule, MatIconModule, MatMenuModule],
  templateUrl: './doctors-listing.html',
  styleUrl: './doctors-listing.css',
})
export class DoctorsListing implements AfterViewInit {

  displayedColumns = ['name', 'phone', 'regNo', 'address','action'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ✅ signal from store
  doctors = computed(() => this.store.doctors());

  constructor(
    public store: DataStoreService,
    private dialog: MatDialog
  ) {
    // 🔥 bridge signal → material table
    effect(() => {
      this.dataSource.data = this.doctors();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  editDoctor(doctor: any) {
  const dialogRef = this.dialog.open(EditDialog, {
    data: { ...doctor,type: 'doctor' },
    width: '26%',
    maxHeight: '70vh',
    autoFocus: false,
    panelClass: 'dialog-wrapper',
  });

  dialogRef.afterClosed().subscribe(async updated => {
    if (updated) {
      // ✅ Update the doctor in your signal store
      await this.store.updateDoctor(updated);
    }
  });
}

}
