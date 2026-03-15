import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  accessToken: string;
  client: {
    _id: string;
    shopName: string;
    ownerName: string;
    email: string;
    phone?: string;
    address?: string;
    dlNo?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly CLIENT_KEY = 'auth_client';

  currentClient = signal<AuthResponse['client'] | null>(this.loadClient());
  isLoggedIn = computed(() => !!this.currentClient());
  shopName = computed(() => this.currentClient()?.shopName ?? '');

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  register(data: {
    shopName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    dlNo?: string;
  }) {
    return this.http.post<AuthResponse>(`${this.API}/register`, data);
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password });
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.API}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.API}/reset-password`, { token, newPassword });
  }

  handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(res.client));
    this.currentClient.set(res.client);
    this.router.navigate(['/dashboard']);
  }

  handleAdminLogin(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(res.client));
    this.currentClient.set(res.client);
    this.router.navigate(['/admin/register']);
  }

  updateLocalClient(client: AuthResponse['client']) {
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(client));
    this.currentClient.set(client);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CLIENT_KEY);
    this.currentClient.set(null);
    this.router.navigate(['/login']);
  }

  private loadClient(): AuthResponse['client'] | null {
    const raw = localStorage.getItem(this.CLIENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
