import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="auth-wrap card" style="text-align:center">
      <h1>404</h1>
      <p class="muted">That page does not exist.</p>
      <a class="btn" routerLink="/dashboard">Go to dashboard</a>
    </div>
  `,
})
export class NotFoundComponent {}
