import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  hidePassword = true;
  hideConfirm = true;
  loading = signal(false);
  error = signal('');
  success = signal('');
  private token = '';

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error.set('Invalid reset link. No token found.');
      }
    });
  }

  submit() {
    if (!this.newPassword || !this.confirmPassword) {
      this.error.set('Please fill both fields');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.success.set(res.message);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Reset failed. Token may be expired.');
        this.loading.set(false);
      },
    });
  }
}
