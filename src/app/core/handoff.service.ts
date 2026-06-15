import { Injectable, signal } from '@angular/core';
import { DoubleCheckPrefill } from './models';

/**
 * Carries a "double-check this AI answer" payload from the chat page to the
 * verification page. The verification page consumes it once via `take()`.
 */
@Injectable({ providedIn: 'root' })
export class HandoffService {
  private readonly _pending = signal<DoubleCheckPrefill | null>(null);

  set(prefill: DoubleCheckPrefill): void {
    this._pending.set(prefill);
  }

  /** Returns the pending prefill (if any) and clears it. */
  take(): DoubleCheckPrefill | null {
    const value = this._pending();
    this._pending.set(null);
    return value;
  }
}
