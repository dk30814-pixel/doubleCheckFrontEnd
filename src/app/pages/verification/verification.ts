import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { HandoffService } from '../../core/handoff.service';
import { readError } from '../../core/http-error';
import {
  CategoryResponse,
  ExpertMatchResponse,
  VerificationSessionResponse,
  sessionOutcomeLabel,
  sessionStatusLabel,
} from '../../core/models';

@Component({
  selector: 'app-verification',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <h1>Verification</h1>
      <p class="muted">Have a human expert double-check an answer.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (notice()) {
      <div class="alert success">{{ notice() }}</div>
    }

    @if (canRequest() || prefillActive()) {
      <div class="card">
        <h2>Request a verification</h2>
        @if (prefillActive()) {
          <p class="muted">Carried over from your AI chat — just choose an expert below.</p>
        }
        <label for="cat">Category</label>
        <select id="cat" name="cat" [(ngModel)]="categoryId" (change)="findExperts()">
          <option value="">— choose —</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>

        @if (categoryId) {
          <label for="exp">Expert</label>
          <select id="exp" name="exp" [(ngModel)]="professionalUserId">
            <option value="">— choose —</option>
            @for (e of experts(); track e.userId) {
              <option [value]="e.userId">{{ e.displayName }} (rate {{ e.rate }})</option>
            }
          </select>
          @if (!experts().length) {
            <small class="muted">No available experts for this category yet.</small>
          }
        }

        <label for="q">Question</label>
        <textarea id="q" name="q" rows="2" [(ngModel)]="questionText"></textarea>
        <label for="ai">AI answer to verify</label>
        <textarea id="ai" name="ai" rows="3" [(ngModel)]="aiAnswerText"></textarea>

        <div style="margin-top: 0.9rem">
          <button class="btn" (click)="create()" [disabled]="saving()">Submit request</button>
        </div>
      </div>
    }

    @if (auth.isProfessional()) {
      <div class="card">
        <h2>Incoming requests</h2>
        @if (incoming().length) {
          @for (s of incoming(); track s.id) {
            <div class="card" style="background:#f8fafc">
              <div class="row">
                <span class="badge" [class.green]="s.status === 1">{{ statusLabel(s.status) }}</span>
                <span class="muted">rate {{ s.agreedRate }} · {{ s.createdAt | date: 'short' }}</span>
              </div>
              <p><strong>Q:</strong> {{ s.questionSnapshot }}</p>
              <p><strong>AI:</strong> {{ s.aiAnswerSnapshot }}</p>
              @if (s.status === 0) {
                <textarea
                  rows="2"
                  placeholder="Your expert solution…"
                  [ngModel]="solutions()[s.id] || ''"
                  (ngModelChange)="setSolution(s.id, $event)"
                  [name]="'sol-' + s.id"
                ></textarea>
                <div style="margin-top: 0.5rem">
                  <button class="btn small" (click)="resolve(s)">Resolve</button>
                </div>
              } @else {
                <p class="muted">Outcome: {{ outcomeLabel(s.outcome) }}</p>
              }
            </div>
          }
        } @else {
          <p class="muted">No incoming requests.</p>
        }
      </div>
    }

    <div class="card">
      <h2>My requests</h2>
      @if (mine().length) {
        @for (s of mine(); track s.id) {
          <div class="card" style="background:#f8fafc">
            <div class="row">
              <span class="badge" [class.green]="s.status === 1">{{ statusLabel(s.status) }}</span>
              <span class="badge">{{ outcomeLabel(s.outcome) }}</span>
              <span class="muted">{{ s.createdAt | date: 'short' }}</span>
            </div>
            <p><strong>Q:</strong> {{ s.questionSnapshot }}</p>
            @if (s.expertSolution) {
              <p><strong>Expert:</strong> {{ s.expertSolution }}</p>
            }
            @if (s.status === 0) {
              <button class="btn danger small" (click)="cancel(s)">Cancel</button>
            }
          </div>
        }
      } @else {
        <p class="muted">You have not requested any verifications.</p>
      }
    </div>
  `,
})
export class VerificationComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly handoff = inject(HandoffService);

  readonly prefillActive = signal(false);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly experts = signal<ExpertMatchResponse[]>([]);
  readonly mine = signal<VerificationSessionResponse[]>([]);
  readonly incoming = signal<VerificationSessionResponse[]>([]);
  readonly solutions = signal<Record<string, string>>({});
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly saving = signal(false);

  categoryId = '';
  professionalUserId = '';
  questionText = '';
  aiAnswerText = '';
  sourceMessageId: string | null = null;

  readonly statusLabel = sessionStatusLabel;
  readonly outcomeLabel = sessionOutcomeLabel;

  canRequest(): boolean {
    return this.auth.roles().includes('Common');
  }

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => {
        /* non-fatal */
      },
    });
    this.loadMine();
    if (this.auth.isProfessional()) {
      this.loadIncoming();
    }

    // If the user arrived here via "Double-check" from the chat page, pre-fill
    // the request with the conversation's category + question + AI answer.
    const prefill = this.handoff.take();
    if (prefill) {
      this.prefillActive.set(true);
      this.categoryId = prefill.categoryId;
      this.questionText = prefill.questionText;
      this.aiAnswerText = prefill.aiAnswerText;
      this.sourceMessageId = prefill.sourceMessageId;
      this.notice.set(`Pick an expert in "${prefill.categoryName}" to double-check this answer.`);
      this.findExperts();
    }
  }

  loadMine(): void {
    this.api.mySessions().subscribe({
      next: (list) => this.mine.set(list),
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load sessions.')),
    });
  }

  loadIncoming(): void {
    this.api.incomingSessions().subscribe({
      next: (list) => this.incoming.set(list),
      error: () => {
        /* non-fatal */
      },
    });
  }

  findExperts(): void {
    this.professionalUserId = '';
    this.experts.set([]);
    if (!this.categoryId) {
      return;
    }
    this.api.experts(this.categoryId).subscribe({
      next: (list) => this.experts.set(list),
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not load experts.')),
    });
  }

  create(): void {
    if (!this.categoryId || !this.professionalUserId) {
      this.error.set('Pick a category and an expert.');
      return;
    }
    if (!this.questionText.trim() || !this.aiAnswerText.trim()) {
      this.error.set('Question and AI answer are required.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .createSession({
        professionalUserId: this.professionalUserId,
        categoryId: this.categoryId,
        questionText: this.questionText.trim(),
        aiAnswerText: this.aiAnswerText.trim(),
        sourceMessageId: this.sourceMessageId,
      })
      .subscribe({
        next: () => {
          this.notice.set('Verification requested.');
          this.saving.set(false);
          this.questionText = '';
          this.aiAnswerText = '';
          this.sourceMessageId = null;
          this.prefillActive.set(false);
          this.loadMine();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readError(err, 'Could not create request.'));
          this.saving.set(false);
        },
      });
  }

  setSolution(id: string, value: string): void {
    this.solutions.set({ ...this.solutions(), [id]: value });
  }

  resolve(s: VerificationSessionResponse): void {
    const solution = (this.solutions()[s.id] ?? '').trim();
    if (!solution) {
      this.error.set('Enter a solution before resolving.');
      return;
    }
    this.error.set(null);
    this.api.resolveSession(s.id, { solution }).subscribe({
      next: () => {
        this.notice.set('Session resolved.');
        this.loadIncoming();
        this.loadMine();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not resolve.')),
    });
  }

  cancel(s: VerificationSessionResponse): void {
    if (!confirm('Cancel this verification request?')) {
      return;
    }
    this.error.set(null);
    this.api.cancelSession(s.id).subscribe({
      next: () => {
        this.notice.set('Request cancelled.');
        this.loadMine();
      },
      error: (err: HttpErrorResponse) => this.error.set(readError(err, 'Could not cancel.')),
    });
  }
}
