import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from './models';

const TOKEN_KEY = 'dc_token';
const USER_KEY = 'dc_user';

interface StoredUser {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
}

/** Holds the JWT + current user and talks to /api/auth. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private readonly _token = signal<string | null>(readToken());
  private readonly _user = signal<StoredUser | null>(readUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly isAdmin = computed(() => this.roles().includes('Admin'));
  readonly isProfessional = computed(() => this.roles().includes('Professional'));

  token(): string | null {
    return this._token();
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/login`, body)
      .pipe(tap((res) => this.persist(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/register`, body)
      .pipe(tap((res) => this.persist(res)));
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/auth/me`);
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private persist(res: AuthResponse): void {
    const user: StoredUser = {
      userId: res.userId,
      email: res.email,
      displayName: res.displayName,
      roles: res.roles ?? [],
    };
    this._token.set(res.accessToken);
    this._user.set(user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}
