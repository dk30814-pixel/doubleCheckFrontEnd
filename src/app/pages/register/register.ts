import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { readError } from '../../core/http-error';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap card">
      <h1>Create account</h1>
      <p class="muted">Register a new DoubleCheck user.</p>

      @if (error()) {
        <div class="alert error">{{ error() }}</div>
      }

      <form (ngSubmit)="submit()">
        <label for="displayName">Display name</label>
        <input id="displayName" name="displayName" [(ngModel)]="displayName" required />

        <label for="email">Email</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />

        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="password"
          required
          autocomplete="new-password"
        />
        <small class="muted">At least 8 characters.</small>

        <div class="row" style="margin-top: 1rem">
          <button class="btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>
          <a routerLink="/login" class="muted">Already registered?</a>
        </div>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.displayName || !this.email || !this.password) {
      this.error.set('All fields are required.');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .register({ displayName: this.displayName, email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: HttpErrorResponse) => {
          this.error.set(readError(err, 'Could not create account.'));
          this.loading.set(false);
        },
      });
  }
}
