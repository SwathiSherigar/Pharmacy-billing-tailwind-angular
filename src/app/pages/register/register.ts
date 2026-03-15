import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
})
export class RegisterComponent {
  shopName = '';
  ownerName = '';
  email = '';
  password = '';
  phone = '';
  address = '';
  dlNo1 = '';
  dlNo2 = '';
  hidePassword = true;
  loading = signal(false);
  error = signal('');
  success = signal('');

  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }

  submit() {
    if (!this.shopName || !this.ownerName || !this.email || !this.password) {
      this.error.set('Please fill all required fields');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.register({
      shopName: this.shopName,
      ownerName: this.ownerName,
      email: this.email,
      password: this.password,
      phone: this.phone || undefined,
      address: this.address || undefined,
      dlNo: [this.dlNo1, this.dlNo2].filter(Boolean).join(',') || undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(`Client "${this.shopName}" registered successfully!`);
        this.shopName = '';
        this.ownerName = '';
        this.email = '';
        this.password = '';
        this.phone = '';
        this.address = '';
        this.dlNo1 = '';
        this.dlNo2 = '';
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
