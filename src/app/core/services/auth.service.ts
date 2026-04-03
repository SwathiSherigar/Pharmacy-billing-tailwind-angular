import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface ClientData {
  _id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  dlNo?: string;
  gstEnabled?: boolean;
  gstNo?: string;
  gstRate?: number;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  client: ClientData;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly CLIENT_KEY = 'auth_client';

  currentClient = signal<ClientData | null>(this.loadClient());
  isLoggedIn = computed(() => !!this.currentClient());
  shopName = computed(() => this.currentClient()?.shopName ?? '');
  gstEnabled = computed(() => this.currentClient()?.gstEnabled ?? false);
  gstRate = computed(() => this.currentClient()?.gstRate ?? 0);

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get refreshTokenValue(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  register(data: {
    shopName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    dlNo?: string;
    gstEnabled?: boolean;
    gstNo?: string;
    gstRate?: number;
  }) {
    return this.http.post<AuthResponse>(`${this.API}/register`, data);
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password });
  }

  refreshToken() {
    const refreshToken = this.refreshTokenValue;
    if (!refreshToken) {
      return Promise.reject('No refresh token');
    }
    return this.http.post<AuthResponse>(`${this.API}/refresh`, { refreshToken }).toPromise();
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.API}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.API}/reset-password`, { token, newPassword });
  }

  handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(res.client));
    this.currentClient.set(res.client);
    this.router.navigate(['/dashboard']);
  }

  handleAdminLogin(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(res.client));
    this.currentClient.set(res.client);
    this.router.navigate(['/admin/register']);
  }

  updateLocalClient(client: ClientData) {
    localStorage.setItem(this.CLIENT_KEY, JSON.stringify(client));
    this.currentClient.set(client);
  }

  async logout() {
    try {
      await this.http.post(`${this.API}/logout`, {}).toPromise();
    } catch {}
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.CLIENT_KEY);
    this.currentClient.set(null);
    this.onLogout?.();
    this.router.navigate(['/login']);
  }

  /** Callback set by SyncCheckService to reset sync state on logout */
  onLogout?: () => void;

  updateTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private loadClient(): ClientData | null {
    const raw = localStorage.getItem(this.CLIENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
