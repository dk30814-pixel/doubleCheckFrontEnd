import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { readError } from '../../core/http-error';
import { CategoryResponse } from '../../core/models';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>Categories</h1>
      <p class="muted">Topics used to route questions to the right experts.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (notice()) {
      <div class="alert success">{{ notice() }}</div>
    }

    @if (auth.isAdmin()) {
      <div class="card">
        <h2>{{ editingId() ? 'Edit category' : 'New category' }}</h2>
        <label for="cname">Name</label>
        <input id="cname" name="cname" [(ngModel)]="name" />
        <label for="cdesc">Description</label>
        <input id="cdesc" name="cdesc" [(ngModel)]="description" />
        <div class="row" style="margin-top: 0.75rem">
          <button class="btn" (click)="save()" [disabled]="saving()">
            {{ editingId() ? 'Update' : 'Create' }}
          </button>
          @if (editingId()) {
            <button class="btn ghost" (click)="resetForm()">Cancel</button>
          }
        </div>
      </div>
    }

    <div class="card">
      <h2>All categories</h2>
      @if (categories().length) {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              @if (auth.isAdmin()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="muted">{{ c.description || '—' }}</td>
                @if (auth.isAdmin()) {
                  <td>
                    <div class="row">
                      <button class="btn ghost small" (click)="edit(c)">Edit</button>
                      <button class="btn danger small" (click)="remove(c)">Delete</button>
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="muted">No categories found.</p>
      }
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  name = '';
  description = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not load categories.')),
    });
  }

  edit(c: CategoryResponse): void {
    this.editingId.set(c.id);
    this.name = c.name;
    this.description = c.description ?? '';
    this.notice.set(null);
  }

  resetForm(): void {
    this.editingId.set(null);
    this.name = '';
    this.description = '';
  }

  save(): void {
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const body = { name: this.name.trim(), description: this.description.trim() || null };
    const id = this.editingId();
    const req = id ? this.api.updateCategory(id, body) : this.api.createCategory(body);
    req.subscribe({
      next: () => {
        this.notice.set(id ? 'Category updated.' : 'Category created.');
        this.saving.set(false);
        this.resetForm();
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readError(err, 'Could not save category.'));
        this.saving.set(false);
      },
    });
  }

  remove(c: CategoryResponse): void {
    if (!confirm(`Delete category "${c.name}"?`)) {
      return;
    }
    this.error.set(null);
    this.api.deleteCategory(c.id).subscribe({
      next: () => {
        this.notice.set('Category deleted.');
        this.load();
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not delete category.')),
    });
  }
}
