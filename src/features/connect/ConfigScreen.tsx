import { useState } from "react";
import { VaultApi } from "../../lib/vault/parachute/api";
import { AuthManager } from "../../lib/vault/parachute/auth";
import { beginOAuth, InsecureContextError, normalizeVaultUrl } from "../../lib/vault/parachute/oauth";
import { DEFAULT_SCOPE, type AuthSession } from "../../lib/vault/parachute/types";

// First-run connect screen, adapted from Adam Deck. Primary path is OAuth
// (browser sign-in via the hub, PKCE + dynamic client registration — no secret
// to paste). Token-paste fallback + a no-vault demo mode are also offered.
export function ConfigScreen({
  initialUrl,
  notice,
  onConnected,
  onDemo,
}: {
  initialUrl?: string;
  notice?: string;
  onConnected: (session: AuthSession) => void;
  onDemo?: () => void;
}) {
  const [url, setUrl] = useState(initialUrl ?? "https://friends.parachute.computer/vault/adam");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState("");

  async function handleOAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Enter your vault URL first.");
      return;
    }
    setBusy(true);
    try {
      const authorizeUrl = await beginOAuth(url, DEFAULT_SCOPE);
      window.location.assign(authorizeUrl);
    } catch (err) {
      setBusy(false);
      if (err instanceof InsecureContextError) setError(err.message);
      else setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleToken(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let vaultUrl: string;
    try {
      vaultUrl = normalizeVaultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    if (!token.trim()) {
      setError("Paste a token, or use OAuth above.");
      return;
    }
    const session: AuthSession = {
      vaultUrl,
      token: { accessToken: token.trim(), scope: DEFAULT_SCOPE },
    };
    setBusy(true);
    try {
      await new VaultApi(new AuthManager(session, () => {})).queryNotes({ limit: 1 });
      onConnected(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="config-screen">
      <form className="config-card" onSubmit={handleOAuth}>
        <h1>Adam's Cockpit</h1>
        <p className="muted">
          A spatial view of your Parachute vault. Sign in through your hub with OAuth —
          your token is stored only in this browser and sent only to your vault.
        </p>

        <label>
          Vault URL
          <input
            type="url"
            placeholder="https://friends.parachute.computer/vault/adam"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="hint">
            The vault root — everything before <code>/api</code>.
          </span>
        </label>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "Connecting…" : "Connect with OAuth"}
        </button>

        <button type="button" className="ghost tiny link" onClick={() => setShowToken((s) => !s)}>
          {showToken ? "Hide token option" : "Advanced: paste a token instead"}
        </button>

        {showToken && (
          <div className="token-fallback">
            <label>
              API token
              <input
                type="password"
                placeholder="hub JWT with vault:write scope"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="hint">
                Sent as <code>Authorization: Bearer …</code>
              </span>
            </label>
            <button type="button" className="ghost" onClick={handleToken} disabled={busy}>
              {busy ? "Checking…" : "Connect with token"}
            </button>
          </div>
        )}

        {onDemo && (
          <button type="button" className="ghost tiny link" onClick={onDemo}>
            Explore the demo (seeded mock · no vault)
          </button>
        )}
      </form>
    </div>
  );
}
