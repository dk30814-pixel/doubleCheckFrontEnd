import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { readError } from '../../core/http-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap card">
      <h1>Log in</h1>
      <p class="muted">Sign in to your DoubleCheck account.</p>

      @if (error()) {
        <div class="alert error">{{ error() }}</div>
      }

      <form (ngSubmit)="submit()">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />

        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="password"
          required
          autocomplete="current-password"
        />

        <div class="row" style="margin-top: 1rem">
          <button class="btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Log in' }}
          </button>
          <a routerLink="/register" class="muted">Need an account?</a>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.error.set(readError(err, 'Invalid email or password.'));
        this.loading.set(false);
      },
    });
  }
}
