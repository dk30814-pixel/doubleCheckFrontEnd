import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { HandoffService } from '../../core/handoff.service';
import { readError } from '../../core/http-error';
import { CategoryResponse, ConversationResponse, MessageResponse } from '../../core/models';

interface Exchange {
  user: MessageResponse;
  ai: MessageResponse;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>Ask AI</h1>
      <p class="muted">Get an instant AI answer, then accept it or have an expert double-check it.</p>
    </div>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }

    <div class="card">
      @if (conversation(); as c) {
        <div class="row" style="justify-content: space-between">
          <strong>{{ c.title }}</strong>
          <span class="badge">{{ c.categoryName }}</span>
        </div>
      } @else {
        <label for="cat">Category</label>
        <select id="cat" name="cat" [(ngModel)]="categoryId">
          <option value="">— choose a category —</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <small class="muted">Pick the topic your question is about. Experts are matched on it.</small>
      }
    </div>

    @if (exchanges().length) {
      <div class="card">
        @for (ex of exchanges(); track ex.ai.id) {
          <div class="msg user"><span class="who">You</span>{{ ex.user.content }}</div>
          <div class="msg ai">
            <span class="who">AI</span>{{ ex.ai.content }}
            <div class="row actions">
              @if (acceptedIds().has(ex.ai.id)) {
                <span class="badge green">Accepted ✓</span>
              } @else {
                <button class="btn ghost small" (click)="accept(ex)">Accept answer</button>
                <button class="btn small" (click)="doubleCheck(ex)">Double-check with an expert</button>
              }
            </div>
          </div>
        }
      </div>
    }

    <div class="card">
      <label for="msg">Your question</label>
      <textarea
        id="msg"
        name="msg"
        rows="3"
        [(ngModel)]="draft"
        placeholder="Ask anything…"
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <div class="row" style="margin-top: 0.75rem">
        <button class="btn" (click)="send()" [disabled]="sending()">
          {{ sending() ? 'Thinking…' : 'Send' }}
        </button>
        <span class="muted">Press Enter to send · Shift+Enter for a new line</span>
      </div>
    </div>
  `,
  styles: [
    `
      .msg {
        padding: 0.6rem 0.8rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        max-width: 85%;
        white-space: pre-wrap;
      }
      .msg .who {
        display: block;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 0.2rem;
      }
      .msg.user {
        background: #dbeafe;
        margin-left: auto;
      }
      .msg.ai {
        background: #f1f5f9;
      }
      .actions {
        margin-top: 0.6rem;
      }
    `,
  ],
})
export class ChatComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly handoff = inject(HandoffService);
  private readonly router = inject(Router);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly conversation = signal<ConversationResponse | null>(null);
  readonly exchanges = signal<Exchange[]>([]);
  readonly acceptedIds = signal<Set<string>>(new Set());
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);

  categoryId = '';
  draft = '';

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: (err: HttpErrorResponse) =>
        this.error.set(readError(err, 'Could not load categories.')),
    });
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) {
      return;
    }
    if (!this.conversation() && !this.categoryId) {
      this.error.set('Pick a category first.');
      return;
    }
    this.sending.set(true);
    this.error.set(null);

    const existing = this.conversation();
    const ensureConversation = existing
      ? of(existing)
      : this.api.createConversation({ title: text.slice(0, 60), categoryId: this.categoryId });

    ensureConversation
      .pipe(
        switchMap((conv) => {
          this.conversation.set(conv);
          return this.api.sendMessage(conv.id, { content: text });
        }),
      )
      .subscribe({
        next: (res) => {
          this.exchanges.update((list) => [
            ...list,
            { user: res.userMessage, ai: res.aiMessage },
          ]);
          this.draft = '';
          this.sending.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readError(err, 'Could not get an answer.'));
          this.sending.set(false);
        },
      });
  }

  accept(ex: Exchange): void {
    this.acceptedIds.update((set) => new Set(set).add(ex.ai.id));
  }

  doubleCheck(ex: Exchange): void {
    const conv = this.conversation();
    if (!conv) {
      return;
    }
    this.handoff.set({
      categoryId: conv.categoryId,
      categoryName: conv.categoryName,
      questionText: ex.user.content,
      aiAnswerText: ex.ai.content,
      sourceMessageId: ex.ai.id,
    });
    this.router.navigate(['/verification']);
  }
}
