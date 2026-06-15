import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { readError } from '../../core/http-error';
import {
  CategoryResponse,
  ProfessionalApplicationResponse,
  ProfessionalProfileResponse,
} from '../../core/models';

@Component({
  selector: 'app-professional',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <h1>Professional</h1>
      <p class="muted">Apply to verify answers, then manage your expert profile.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (notice()) {
      <div class="alert success">{{ notice() }}</div>
    }

    <div class="card">
      <h2>My application</h2>
      @if (myApp(); as a) {
        <div class="row">
          <span
            class="badge"
            [class.green]="a.status === 'Approved'"
            [class.amber]="a.status === 'Pending'"
            [class.red]="a.status === 'Rejected'"
            >{{ a.status }}</span
          >
          <span class="muted">requested rate {{ a.requestedRate }} · submitted {{ a.createdAt | date: 'short' }}</span>
        </div>
        @if (a.bio) {
          <p>{{ a.bio }}</p>
        }
      } @else {
        <p class="muted">You have not applied yet.</p>
      }
    </div>

    @if (!auth.isProfessional()) {
      <div class="card">
        <h2>Apply to become a professional</h2>
        <label for="rate">Requested rate (per answer)</label>
        <input id="rate" name="rate" type="number" min="0" [(ngModel)]="rate" />
        <label for="bio">Short bio</label>
        <textarea id="bio" name="bio" rows="3" [(ngModel)]="bio"></textarea>
        <label>Categories you can cover</label>
        @if (categories().length) {
          <div class="row">
            @for (c of categories(); track c.id) {
              <label class="row" style="font-weight: 400; margin: 0">
                <input
                  type="checkbox"
                  style="width:auto"
                  [checked]="selected().has(c.id)"
                  (change)="toggle(c.id)"
                />
                {{ c.name }}
              </label>
            }
          </div>
        } @else {
          <p class="muted">No categories available.</p>
        }
        <div style="margin-top: 0.9rem">
          <button class="btn" (click)="apply()" [disabled]="saving()">Submit application</button>
        </div>
      </div>
    } @else {
      <div class="card">
        <h2>My expert profile</h2>
        @if (profile(); as p) {
          <div class="row" style="margin-bottom: 0.5rem">
            <span class="badge" [class.green]="p.isAvailable">{{
              p.isAvailable ? 'Available' : 'Unavailable'
            }}</span>
            <button class="btn ghost small" (click)="toggleAvailability(p)">
              Set {{ p.isAvailable ? 'unavailable' : 'available' }}
            </button>
          </div>
        }
        <label for="prate">Rate per answer</label>
        <input id="prate" name="prate" type="number" min="0" [(ngModel)]="rate" />
        <label for="pbio">Bio</label>
        <textarea id="pbio" name="pbio" rows="3" [(ngModel)]="bio"></textarea>
        <label>Categories</label>
        <div class="row">
          @for (c of categories(); track c.id) {
            <label class="row" style="font-weight: 400; margin: 0">
              <input
                type="checkbox"
                style="width:auto"
                [checked]="selected().has(c.id)"
                (change)="toggle(c.id)"
              />
              {{ c.name }}
            </label>
          }
        </div>
        <div style="margin-top: 0.9rem">
          <button class="btn" (click)="saveProfile()" [disabled]="saving()">Save profile</button>
        </div>
      </div>
    }
  `,
})
export class ProfessionalComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly myApp = signal<ProfessionalApplicationResponse | null>(null);
  readonly profile = signal<ProfessionalProfileResponse | null>(null);
  readonly selected = signal<Set<string>>(new Set());
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly saving = signal(false);

  rate = 0;
  bio = '';

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not load categories.')),
    });

    this.api.myApplication().subscribe({
      next: (a) => {
        this.myApp.set(a);
        this.rate = a.requestedRate;
        this.bio = a.bio ?? '';
        this.selected.set(new Set(a.categoryIds));
      },
      // 404 simply means "no application yet" — not an error to surface.
      error: (err: HttpErrorResponse) => {
        if (err.status !== 404) {
          this.error.set(readError(err, 'Could not load your application.'));
        }
      },
    });

    if (this.auth.isProfessional()) {
      const userId = this.auth.user()?.userId;
      if (userId) {
        this.api.getProfessional(userId).subscribe({
          next: (p) => {
            this.profile.set(p);
            this.rate = p.ratePerAnswer;
            this.bio = p.bio ?? '';
            this.selected.set(new Set(p.categoryIds));
          },
          error: () => {
            /* profile may not exist yet */
          },
        });
      }
    }
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selected.set(next);
  }

  apply(): void {
    const categoryIds = [...this.selected()];
    if (!categoryIds.length) {
      this.error.set('Pick at least one category.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .applyProfessional({ requestedRate: Number(this.rate), bio: this.bio.trim() || null, categoryIds })
      .subscribe({
        next: (a) => {
          this.myApp.set(a);
          this.notice.set('Application submitted.');
          this.saving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readError(err, 'Could not submit application.'));
          this.saving.set(false);
        },
      });
  }

  saveProfile(): void {
    const categoryIds = [...this.selected()];
    if (!categoryIds.length) {
      this.error.set('Pick at least one category.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .updateProfessional({ ratePerAnswer: Number(this.rate), bio: this.bio.trim() || null, categoryIds })
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.notice.set('Profile saved.');
          this.saving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readError(err, 'Could not save profile.'));
          this.saving.set(false);
        },
      });
  }

  toggleAvailability(p: ProfessionalProfileResponse): void {
    this.error.set(null);
    this.api.setAvailability(!p.isAvailable).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.notice.set('Availability updated.');
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not update availability.')),
    });
  }
}
