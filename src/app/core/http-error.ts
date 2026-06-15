import { HttpErrorResponse } from '@angular/common/http';

/** Pulls the API's `{ error }` message out of a failed response, with a fallback. */
export function readError(err: HttpErrorResponse, fallback = 'Something went wrong.'): string {
  const body = err.error as { error?: string } | string | null;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object' && body.error) {
    return body.error;
  }
  if (err.status === 0) {
    return 'Cannot reach the API. Is the backend running?';
  }
  return fallback;
}
