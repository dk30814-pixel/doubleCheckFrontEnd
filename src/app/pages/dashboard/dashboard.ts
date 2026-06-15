import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { readError } from '../../core/http-error';
import { BalanceResponse, MeResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>Dashboard</h1>
      <p class="muted">Your profile and wallet at a glance.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }

    <div class="grid cols-2">
      <div class="card">
        <h2>Profile</h2>
        @if (me(); as m) {
          <p><strong>{{ m.displayName }}</strong></p>
          <p class="muted">{{ m.email }}</p>
          <div class="row">
            @for (r of m.roles; track r) {
              <span class="badge">{{ r }}</span>
            }
          </div>
        } @else {
          <p class="muted">Loading…</p>
        }
      </div>

      <div class="card">
        <h2>Wallet balance</h2>
        @if (balance(); as b) {
          <div class="stat">{{ b.balance | number: '1.2-2' }} <span class="muted" style="font-size:1rem">credits</span></div>
        } @else {
          <p class="muted">Loading…</p>
        }
      </div>
    </div>

    <div class="card">
      <h2>Recent transactions</h2>
      @if (balance(); as b) {
        @if (b.recentTransactions.length) {
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amount</th><th>Reason</th></tr>
            </thead>
            <tbody>
              @for (t of b.recentTransactions; track t.createdAt + t.reason) {
                <tr>
                  <td>{{ t.createdAt | date: 'short' }}</td>
                  <td>{{ t.type }}</td>
                  <td>{{ t.amount | number: '1.2-2' }}</td>
                  <td>{{ t.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="muted">No transactions yet.</p>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly me = signal<MeResponse | null>(null);
  readonly balance = signal<BalanceResponse | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (m) => this.me.set(m),
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load profile.')),
    });
    this.api.getBalance().subscribe({
      next: (b) => this.balance.set(b),
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load balance.')),
    });
  }
}
