// TypeScript shapes mirroring the backend DTOs (DoubleCheck API).
// NOTE: the conversations/chat endpoints are intentionally NOT modelled here —
// that part of the API has a known bug and must not be called from the frontend.

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  balance: number;
  roles: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ---- Account / wallet ----
export interface WalletTransaction {
  amount: number;
  type: string;
  reason: string;
  relatedSessionId: string | null;
  createdAt: string;
}

export interface BalanceResponse {
  balance: number;
  recentTransactions: WalletTransaction[];
}

// ---- Categories ----
export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string | null;
}

// ---- Professionals ----
export interface ApplyProfessionalRequest {
  requestedRate: number;
  bio?: string | null;
  categoryIds: string[];
}

export interface UpdateProfessionalRequest {
  ratePerAnswer: number;
  bio?: string | null;
  categoryIds: string[];
}

export interface ProfessionalApplicationResponse {
  id: string;
  requestedRate: number;
  bio: string | null;
  status: string;
  categoryIds: string[];
  createdAt: string;
  decidedAt: string | null;
}

export interface ProfessionalProfileResponse {
  userId: string;
  displayName: string;
  ratePerAnswer: number;
  isAvailable: boolean;
  bio: string | null;
  categoryIds: string[];
}

// ---- Admin ----
export interface AdminUserResponse {
  id: string;
  email: string;
  displayName: string;
  balance: number;
  roles: string[];
}

export interface AdminProfessionalApplicationResponse {
  id: string;
  userId: string;
  requestedRate: number;
  bio: string | null;
  status: string;
  categoryIds: string[];
  createdAt: string;
  decidedAt: string | null;
}

export interface AdminStatsResponse {
  users: number;
  conversations: number;
  messages: number;
  openSessions: number;
  closedSessions: number;
  resolutionRate: number;
}

// ---- Verification ----
// Status/Outcome are serialised by the backend as integers (no string enum
// converter is configured), so we model them as numbers and label them in the UI.
export const SessionStatus = { Open: 0, Closed: 1 } as const;
export const SessionOutcome = { None: 0, Resolved: 1, Cancelled: 2, Expired: 3 } as const;

export interface ExpertCategory {
  id: string;
  name: string;
}

export interface ExpertMatchResponse {
  userId: string;
  displayName: string;
  rate: number;
  categories: ExpertCategory[];
}

export interface CreateVerificationSessionRequest {
  professionalUserId: string;
  categoryId: string;
  sourceMessageId?: string | null;
  questionText: string;
  aiAnswerText: string;
}

export interface ResolveVerificationSessionRequest {
  solution: string;
}

export interface VerificationSessionResponse {
  id: string;
  requesterUserId: string;
  professionalUserId: string;
  categoryId: string;
  sourceMessageId: string | null;
  questionSnapshot: string;
  aiAnswerSnapshot: string;
  agreedRate: number;
  status: number;
  outcome: number;
  expertSolution: string | null;
  closedAt: string | null;
  createdAt: string;
}

export function sessionStatusLabel(status: number): string {
  return status === SessionStatus.Closed ? 'Closed' : 'Open';
}

export function sessionOutcomeLabel(outcome: number): string {
  switch (outcome) {
    case SessionOutcome.Resolved:
      return 'Resolved';
    case SessionOutcome.Cancelled:
      return 'Cancelled';
    case SessionOutcome.Expired:
      return 'Expired';
    default:
      return 'None';
  }
}
