import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { readError } from '../../core/http-error';
import {
  AdminProfessionalApplicationResponse,
  AdminStatsResponse,
  AdminUserResponse,
} from '../../core/models';

const ROLES = ['Common', 'Professional', 'Admin'];

@Component({
  selector: 'app-admin',
  imports: [FormsModule, DatePipe, DecimalPipe, PercentPipe],
  template: `
    <div class="page-head">
      <h1>Admin</h1>
      <p class="muted">Platform oversight: users, applications and statistics.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (notice()) {
      <div class="alert success">{{ notice() }}</div>
    }

    @if (stats(); as s) {
      <div class="grid cols-2">
        <div class="card"><div class="stat">{{ s.users }}</div><span class="muted">Users</span></div>
        <div class="card"><div class="stat">{{ s.openSessions }}</div><span class="muted">Open sessions</span></div>
        <div class="card"><div class="stat">{{ s.closedSessions }}</div><span class="muted">Closed sessions</span></div>
        <div class="card"><div class="stat">{{ s.resolutionRate | percent: '1.0-1' }}</div><span class="muted">Resolution rate</span></div>
      </div>
    }

    <div class="card">
      <h2>Professional applications</h2>
      <div class="row" style="margin-bottom: 0.75rem">
        <select [(ngModel)]="statusFilter" (change)="loadApps()" name="statusFilter" style="width:auto">
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      @if (apps().length) {
        <table>
          <thead>
            <tr><th>User</th><th>Rate</th><th>Status</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            @for (a of apps(); track a.id) {
              <tr>
                <td class="muted">{{ a.userId }}</td>
                <td>{{ a.requestedRate }}</td>
                <td>
                  <span
                    class="badge"
                    [class.green]="a.status === 'Approved'"
                    [class.amber]="a.status === 'Pending'"
                    [class.red]="a.status === 'Rejected'"
                    >{{ a.status }}</span
                  >
                </td>
                <td>{{ a.createdAt | date: 'short' }}</td>
                <td>
                  @if (a.status === 'Pending') {
                    <div class="row">
                      <button class="btn small" (click)="approve(a)">Approve</button>
                      <button class="btn danger small" (click)="reject(a)">Reject</button>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="muted">No applications.</p>
      }
    </div>

    <div class="card">
      <h2>Users</h2>
      @if (users().length) {
        <table>
          <thead>
            <tr><th>User</th><th>Balance</th><th>Roles</th><th>Manage role</th></tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td>
                  <strong>{{ u.displayName }}</strong><br />
                  <span class="muted">{{ u.email }}</span>
                </td>
                <td>{{ u.balance | number: '1.2-2' }}</td>
                <td>
                  <div class="row">
                    @for (r of u.roles; track r) {
                      <span class="badge">{{ r }}</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="row">
                    <select [(ngModel)]="roleChoice[u.id]" [name]="'role-' + u.id" style="width:auto">
                      @for (r of roles; track r) {
                        <option [value]="r">{{ r }}</option>
                      }
                    </select>
                    <button class="btn small" (click)="assign(u)">Add</button>
                    <button class="btn ghost small" (click)="revoke(u)">Remove</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="muted">No users.</p>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly users = signal<AdminUserResponse[]>([]);
  readonly apps = signal<AdminProfessionalApplicationResponse[]>([]);
  readonly stats = signal<AdminStatsResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly roles = ROLES;
  roleChoice: Record<string, string> = {};
  statusFilter = '';

  ngOnInit(): void {
    this.loadStats();
    this.loadApps();
    this.loadUsers();
  }

  loadStats(): void {
    this.api.adminStats().subscribe({
      next: (s) => this.stats.set(s),
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load stats.')),
    });
  }

  loadApps(): void {
    this.api.adminApplications(this.statusFilter || undefined).subscribe({
      next: (list) => this.apps.set(list),
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not load applications.')),
    });
  }

  loadUsers(): void {
    this.api.adminUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        for (const u of list) {
          if (!this.roleChoice[u.id]) {
            this.roleChoice[u.id] = 'Professional';
          }
        }
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load users.')),
    });
  }

  approve(a: AdminProfessionalApplicationResponse): void {
    this.error.set(null);
    this.api.adminApprove(a.id).subscribe({
      next: () => {
        this.notice.set('Application approved.');
        this.loadApps();
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not approve.')),
    });
  }

  reject(a: AdminProfessionalApplicationResponse): void {
    this.error.set(null);
    this.api.adminReject(a.id).subscribe({
      next: () => {
        this.notice.set('Application rejected.');
        this.loadApps();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not reject.')),
    });
  }

  assign(u: AdminUserResponse): void {
    const role = this.roleChoice[u.id];
    this.error.set(null);
    this.api.adminAssignRole(u.id, role).subscribe({
      next: () => {
        this.notice.set(`Granted ${role} to ${u.displayName}.`);
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not assign role.')),
    });
  }

  revoke(u: AdminUserResponse): void {
    const role = this.roleChoice[u.id];
    this.error.set(null);
    this.api.adminRevokeRole(u.id, role).subscribe({
      next: () => {
        this.notice.set(`Removed ${role} from ${u.displayName}.`);
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not revoke role.')),
    });
  }
}
