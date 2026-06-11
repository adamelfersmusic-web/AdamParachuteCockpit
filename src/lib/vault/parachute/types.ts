// Auth + vault-API types, lifted from Adam Deck's proven Parachute plumbing
// (reused as-is). Deck-domain types are intentionally NOT carried over — the
// Cockpit has its own model in lib/model/types.ts.

export interface Note {
  id: string;
  path: string;
  title: string; // derived from the path basename
  content?: string; // only present after a single-note fetch / include_content
  preview?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  links?: NoteLink[];
  createdAt?: string;
  updatedAt?: string;
  byteSize?: number;
}

export interface NoteLink {
  target: string;
  relationship: string;
}

export interface TagInfo {
  name: string;
  count: number;
}

export type TokenScope = string;
export const DEFAULT_SCOPE: TokenScope = "vault:read vault:write";

export interface StoredToken {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
  scope: TokenScope;
  vault?: string;
}

export interface AuthSession {
  vaultUrl: string;
  issuer?: string;
  tokenEndpoint?: string;
  clientId?: string;
  token: StoredToken;
}

export interface AuthServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  code_challenge_methods_supported?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  scope: TokenScope;
  vault?: string;
  refresh_token?: string;
  expires_in?: number;
  services?: Record<string, { url?: string } | undefined>;
}

export interface PendingOAuth {
  issuerUrl: string;
  issuer: string;
  tokenEndpoint: string;
  clientId: string;
  codeVerifier: string;
  state: string;
  redirectUri: string;
  scope: TokenScope;
  startedAt: string;
}
