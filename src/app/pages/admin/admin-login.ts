import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-login.html',
})
export class AdminLoginComponent {
  email = '';
  password = '';
  hidePassword = true;
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/admin/register']);
    }
  }

  submit() {
    if (!this.email || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.handleAdminLogin(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}
