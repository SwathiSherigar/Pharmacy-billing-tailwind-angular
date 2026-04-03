import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Patients
  getPatients(search?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return firstValueFrom(this.http.get<any[]>(`${this.API}/patients`, { params }));
  }

  createPatient(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/patients`, data));
  }

  updatePatient(id: string, data: any) {
    return firstValueFrom(this.http.put<any>(`${this.API}/patients/${id}`, data));
  }

  findOrCreatePatient(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/patients/find-or-create`, data));
  }

  // Doctors
  getDoctors(search?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return firstValueFrom(this.http.get<any[]>(`${this.API}/doctors`, { params }));
  }

  createDoctor(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/doctors`, data));
  }

  updateDoctor(id: string, data: any) {
    return firstValueFrom(this.http.put<any>(`${this.API}/doctors/${id}`, data));
  }

  findOrCreateDoctor(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/doctors/find-or-create`, data));
  }

  // Products
  getProducts(search?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return firstValueFrom(this.http.get<any[]>(`${this.API}/products`, { params }));
  }

  findOrCreateProduct(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/products/find-or-create`, data));
  }

  // Batches
  getBatches(filter?: string) {
    const params: Record<string, string> = {};
    if (filter) params['filter'] = filter;
    return firstValueFrom(this.http.get<any[]>(`${this.API}/batches`, { params }));
  }

  getBatchesByProduct(productId: string) {
    return firstValueFrom(this.http.get<any[]>(`${this.API}/batches/product/${productId}`));
  }

  updateBatch(id: string, data: any) {
    return firstValueFrom(this.http.put<any>(`${this.API}/batches/${id}`, data));
  }

  markBatchesReturned(ids: string[]) {
    return firstValueFrom(this.http.post<any>(`${this.API}/batches/mark-returned`, { ids }));
  }

  // Bills
  getBills() {
    return firstValueFrom(this.http.get<any[]>(`${this.API}/bills`));
  }

  getBill(id: string) {
    return firstValueFrom(this.http.get<any>(`${this.API}/bills/${id}`));
  }

  createBill(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/bills`, data));
  }

  updateBill(id: string, data: any) {
    return firstValueFrom(this.http.put<any>(`${this.API}/bills/${id}`, data));
  }

  getNextInvoiceNo() {
    return firstValueFrom(this.http.get<string>(`${this.API}/bills/next-invoice-no`));
  }

  getBillStats() {
    return firstValueFrom(this.http.get<any>(`${this.API}/bills/stats`));
  }

  // Purchase Invoices
  getPurchaseInvoices() {
    return firstValueFrom(this.http.get<any[]>(`${this.API}/purchase-invoices`));
  }

  importPurchaseInvoice(data: any) {
    return firstValueFrom(this.http.post<any>(`${this.API}/purchase-invoices/import`, data));
  }

  // Profile
  getProfile() {
    return firstValueFrom(this.http.get<any>(`${this.API}/auth/profile`));
  }

  updateProfile(data: any) {
    return firstValueFrom(this.http.put<any>(`${this.API}/auth/profile`, data));
  }

  // Sync
  syncPush(data: Record<string, any[]>) {
    return firstValueFrom(this.http.post<any>(`${this.API}/sync/push`, data));
  }

  syncPull() {
    return firstValueFrom(this.http.get<Record<string, any[]>>(`${this.API}/sync/pull`));
  }

  syncPurge() {
    return firstValueFrom(this.http.delete<any>(`${this.API}/sync/purge`));
  }

  syncStatus() {
    return firstValueFrom(this.http.get<{
      counts: Record<string, number>;
      lastSyncedAt: string | null;
    }>(`${this.API}/sync/status`));
  }
}
