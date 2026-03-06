import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface BatchAllocationData {
  productName: string;
  requestedQty: number;
  batches: {
    id: number;
    batch: string;
    expiry: string;
    mrp: number;
    qty: number; // available stock
  }[];
}

export interface BatchAllocationRow {
  batchId: number;
  batch: string;
  expiry: string;
  mrp: number;
  available: number;
  allocate: number;
}

export interface BatchAllocationResult {
  allocated: BatchAllocationRow[];
  unfulfilled: number;
}

@Component({
  selector: 'app-batch-allocation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './batch-allocation-dialog.html',
  styleUrl: './batch-allocation-dialog.css',
})
export class BatchAllocationDialog {
  rows: BatchAllocationRow[] = [];
  displayedColumns = ['batch', 'expiry', 'mrp', 'available', 'allocate', 'amount'];
  productName: string;
  requestedQty: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BatchAllocationData,
    private dialogRef: MatDialogRef<BatchAllocationDialog>
  ) {
    this.productName = data.productName;
    this.requestedQty = data.requestedQty;

    // Pre-allocate using FIFO (earliest expiry first)
    let remaining = data.requestedQty;
    this.rows = data.batches.map(b => {
      const allocate = Math.min(remaining, b.qty);
      remaining = Math.max(0, remaining - allocate);
      return {
        batchId: b.id,
        batch: b.batch,
        expiry: b.expiry,
        mrp: b.mrp,
        available: b.qty,
        allocate,
      };
    });
  }

  get totalAllocated(): number {
    return this.rows.reduce((sum, r) => sum + (r.allocate || 0), 0);
  }

  get totalStock(): number {
    return this.rows.reduce((sum, r) => sum + r.available, 0);
  }

  get totalAmount(): number {
    return this.rows.reduce((sum, r) => sum + (r.allocate || 0) * r.mrp, 0);
  }

  get unfulfilled(): number {
    return Math.max(0, this.requestedQty - this.totalAllocated);
  }

  get isValid(): boolean {
    return this.totalAllocated > 0 && !this.hasOverAllocation;
  }

  get hasOverAllocation(): boolean {
    return this.rows.some(r => r.allocate > r.available);
  }

  confirm() {
    const result: BatchAllocationResult = {
      allocated: this.rows.filter(r => r.allocate > 0),
      unfulfilled: this.unfulfilled,
    };
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
