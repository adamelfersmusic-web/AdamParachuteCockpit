import { saveSession } from "./config";
import { refreshAccessToken, storedFromTokenResponse } from "./oauth";
import type { AuthSession } from "./types";

// Holds the live session and owns token lifecycle: hands the API a valid access
// token (refreshing proactively near expiry), refreshes reactively on a 401,
// persists every rotation, and calls `onChange` so React can re-render / drop
// the session when auth is permanently lost. Lifted from Adam Deck.
export class AuthManager {
  private session: AuthSession;
  private onChange: (session: AuthSession | null) => void;
  private refreshing: Promise<boolean> | null = null;

  constructor(session: AuthSession, onChange: (s: AuthSession | null) => void) {
    this.session = session;
    this.onChange = onChange;
  }

  get vaultBase(): string {
    return this.session.vaultUrl;
  }

  private canRefresh(): boolean {
    const t = this.session.token;
    return Boolean(t.refreshToken && this.session.tokenEndpoint && this.session.clientId);
  }

  private nearExpiry(): boolean {
    const exp = this.session.token.expiresAt;
    return typeof exp === "number" && Date.now() > exp - 30_000;
  }

  async getAccessToken(): Promise<string> {
    if (this.canRefresh() && this.nearExpiry()) await this.tryRefresh();
    return this.session.token.accessToken;
  }

  async tryRefresh(): Promise<boolean> {
    if (!this.canRefresh()) return false;
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      try {
        const res = await refreshAccessToken(
          this.session.tokenEndpoint!,
          this.session.clientId!,
          this.session.token.refreshToken!,
        );
        const stored = storedFromTokenResponse(res);
        if (!stored.refreshToken) stored.refreshToken = this.session.token.refreshToken;
        this.session = { ...this.session, token: stored };
        saveSession(this.session);
        this.onChange(this.session);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }
}
