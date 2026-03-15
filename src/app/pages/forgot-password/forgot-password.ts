import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.email) {
      this.error.set('Please enter your email');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.success.set(res.message);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }
}
