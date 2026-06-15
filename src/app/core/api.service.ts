import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminProfessionalApplicationResponse,
  AdminStatsResponse,
  AdminUserResponse,
  ApplyProfessionalRequest,
  BalanceResponse,
  CategoryResponse,
  ConversationResponse,
  CreateCategoryRequest,
  CreateConversationRequest,
  CreateVerificationSessionRequest,
  ExpertMatchResponse,
  MessageResponse,
  ProfessionalApplicationResponse,
  ProfessionalProfileResponse,
  ResolveVerificationSessionRequest,
  SendMessageRequest,
  SendMessageResponse,
  UpdateCategoryRequest,
  UpdateProfessionalRequest,
  VerificationSessionResponse,
} from './models';

/**
 * Thin typed client over the DoubleCheck REST API.
 * The conversations/chat endpoints are deliberately omitted (known backend bug).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ---- Account ----
  getBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.base}/account/balance`);
  }

  // ---- Categories ----
  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.base}/categories`);
  }

  createCategory(body: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${this.base}/categories`, body);
  }

  updateCategory(id: string, body: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.base}/categories/${id}`, body);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // ---- Professionals ----
  applyProfessional(body: ApplyProfessionalRequest): Observable<ProfessionalApplicationResponse> {
    return this.http.post<ProfessionalApplicationResponse>(
      `${this.base}/professionals/applications`,
      body,
    );
  }

  myApplication(): Observable<ProfessionalApplicationResponse> {
    return this.http.get<ProfessionalApplicationResponse>(
      `${this.base}/professionals/applications/mine`,
    );
  }

  updateProfessional(body: UpdateProfessionalRequest): Observable<ProfessionalProfileResponse> {
    return this.http.put<ProfessionalProfileResponse>(`${this.base}/professionals/me`, body);
  }

  setAvailability(isAvailable: boolean): Observable<ProfessionalProfileResponse> {
    return this.http.put<ProfessionalProfileResponse>(`${this.base}/professionals/me/availability`, {
      isAvailable,
    });
  }

  getProfessional(userId: string): Observable<ProfessionalProfileResponse> {
    return this.http.get<ProfessionalProfileResponse>(`${this.base}/professionals/${userId}`);
  }

  // ---- Admin ----
  adminUsers(): Observable<AdminUserResponse[]> {
    return this.http.get<AdminUserResponse[]>(`${this.base}/admin/users`);
  }

  adminAssignRole(userId: string, role: string): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/roles`, { role });
  }

  adminRevokeRole(userId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}/roles/${role}`);
  }

  adminApplications(status?: string): Observable<AdminProfessionalApplicationResponse[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AdminProfessionalApplicationResponse[]>(
      `${this.base}/admin/professional-applications`,
      { params },
    );
  }

  adminApprove(id: string): Observable<ProfessionalProfileResponse> {
    return this.http.post<ProfessionalProfileResponse>(
      `${this.base}/admin/professional-applications/${id}/approve`,
      {},
    );
  }

  adminReject(id: string): Observable<ProfessionalApplicationResponse> {
    return this.http.post<ProfessionalApplicationResponse>(
      `${this.base}/admin/professional-applications/${id}/reject`,
      {},
    );
  }

  adminStats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.base}/admin/stats`);
  }

  // ---- Conversations / chat ----
  // NOTE: GET /api/conversations (list) is intentionally NOT implemented here —
  // it is the endpoint that returns 500. We only create, send, and read messages.
  createConversation(body: CreateConversationRequest): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(`${this.base}/conversations`, body);
  }

  sendMessage(conversationId: string, body: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(
      `${this.base}/conversations/${conversationId}/messages`,
      body,
    );
  }

  getMessages(conversationId: string): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(
      `${this.base}/conversations/${conversationId}/messages`,
    );
  }

  // ---- Verification ----
  experts(categoryId: string): Observable<ExpertMatchResponse[]> {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<ExpertMatchResponse[]>(`${this.base}/verification/experts`, { params });
  }

  createSession(body: CreateVerificationSessionRequest): Observable<VerificationSessionResponse> {
    return this.http.post<VerificationSessionResponse>(`${this.base}/verification/sessions`, body);
  }

  mySessions(): Observable<VerificationSessionResponse[]> {
    return this.http.get<VerificationSessionResponse[]>(`${this.base}/verification/sessions/mine`);
  }

  incomingSessions(): Observable<VerificationSessionResponse[]> {
    return this.http.get<VerificationSessionResponse[]>(
      `${this.base}/verification/sessions/incoming`,
    );
  }

  getSession(id: string): Observable<VerificationSessionResponse> {
    return this.http.get<VerificationSessionResponse>(`${this.base}/verification/sessions/${id}`);
  }

  resolveSession(
    id: string,
    body: ResolveVerificationSessionRequest,
  ): Observable<VerificationSessionResponse> {
    return this.http.post<VerificationSessionResponse>(
      `${this.base}/verification/sessions/${id}/resolve`,
      body,
    );
  }

  cancelSession(id: string): Observable<VerificationSessionResponse> {
    return this.http.post<VerificationSessionResponse>(
      `${this.base}/verification/sessions/${id}/cancel`,
      {},
    );
  }
}
