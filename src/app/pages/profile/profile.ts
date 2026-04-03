import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  shopName = '';
  ownerName = '';
  email = '';
  phone = '';
  address = '';
  dlNo1 = '';
  dlNo2 = '';
  gstEnabled = false;
  gstNo = '';
  gstRate = 0;

  saving = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  constructor(private auth: AuthService, private api: ApiService) {
    this.loadProfile();
  }

  private async loadProfile() {
    // Start with local data
    this.populateFromClient(this.auth.currentClient());

    // Fetch fresh data from API if logged in
    if (this.auth.isLoggedIn()) {
      try {
        const profile = await this.api.getProfile();
        this.auth.updateLocalClient(profile);
        this.populateFromClient(profile);
      } catch {}
    }
  }

  private populateFromClient(client: any) {
    if (!client) return;

    this.shopName = client.shopName || '';
    this.ownerName = client.ownerName || '';
    this.email = client.email || '';
    this.phone = client.phone || '';
    this.address = client.address || '';
    this.gstEnabled = client.gstEnabled || false;
    this.gstNo = client.gstNo || '';
    this.gstRate = client.gstRate || 0;

    const dlParts = (client.dlNo || '').split(',').map((s: string) => s.trim());
    this.dlNo1 = dlParts[0] || '';
    this.dlNo2 = dlParts[1] || '';
  }

  async save() {
    if (!this.shopName || !this.ownerName) {
      this.message.set('Shop name and owner name are required');
      this.messageType.set('error');
      return;
    }

    this.saving.set(true);
    this.message.set('');

    const data = {
      shopName: this.shopName,
      ownerName: this.ownerName,
      phone: this.phone || undefined,
      address: this.address || undefined,
      dlNo: [this.dlNo1, this.dlNo2].filter(Boolean).join(',') || undefined,
      gstEnabled: this.gstEnabled,
      gstNo: this.gstEnabled ? this.gstNo : '',
      gstRate: this.gstEnabled ? this.gstRate : 0,
    };

    try {
      const updated = await this.api.updateProfile(data);
      this.auth.updateLocalClient(updated);
      this.message.set('Profile updated successfully');
      this.messageType.set('success');
    } catch (err: any) {
      this.message.set(err.error?.message || 'Failed to update profile');
      this.messageType.set('error');
    }

    this.saving.set(false);
  }
}
