import { useEffect, useRef, useState } from "react";
import { useCockpit } from "./state/store";
import { HomeScreen } from "./features/home/HomeScreen";
import { CanvasView } from "./features/canvas/CanvasView";
import { ConfigScreen } from "./features/connect/ConfigScreen";
import { AuthManager } from "./lib/vault/parachute/auth";
import { clearSession, loadSession, saveSession, vaultSlug } from "./lib/vault/parachute/config";
import {
  completeOAuth,
  loadPending,
  PendingApprovalError,
  resolveVaultUrl,
  storedFromTokenResponse,
} from "./lib/vault/parachute/oauth";
import type { AuthSession } from "./lib/vault/parachute/types";
import { createLiveVaultClient, createMockVaultClient } from "./lib/vault";

type OAuthPhase =
  | { kind: "none" }
  | { kind: "completing" }
  | { kind: "approval"; approveUrl: string }
  | { kind: "error"; message: string };

export default function App() {
  const setClient = useCockpit((s) => s.setClient);
  const loadProjects = useCockpit((s) => s.loadProjects);

  const [auth, setAuth] = useState<AuthManager | null>(null);
  const [demo, setDemo] = useState(false);
  const [phase, setPhase] = useState<OAuthPhase>({ kind: "none" });
  const ranReturn = useRef(false);

  function adopt(session: AuthSession) {
    saveSession(session);
    setAuth(
      new AuthManager(session, (next) => {
        if (!next) {
          clearSession();
          setAuth(null);
        }
      }),
    );
  }

  // Handle the OAuth redirect back, or restore a saved session (Deck's flow).
  useEffect(() => {
    if (ranReturn.current) return;
    ranReturn.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");
    const returning = (code && state) || oauthError;

    if (!returning) {
      const saved = loadSession();
      if (saved) adopt(saved);
      return;
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
    if (oauthError) {
      setPhase({ kind: "error", message: `Hub returned: ${oauthError}` });
      return;
    }
    if (!loadPending()) {
      const saved = loadSession();
      if (saved) adopt(saved);
      return;
    }
    setPhase({ kind: "completing" });
    completeOAuth(code!, state!)
      .then(({ pending, token }) => {
        adopt({
          vaultUrl: resolveVaultUrl(token, pending.issuerUrl),
          issuer: pending.issuer,
          tokenEndpoint: pending.tokenEndpoint,
          clientId: pending.clientId,
          token: storedFromTokenResponse(token),
        });
        setPhase({ kind: "none" });
      })
      .catch((err) => {
        if (err instanceof PendingApprovalError)
          setPhase({ kind: "approval", approveUrl: err.approveUrl });
        else setPhase({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      });
  }, []);

  // Wire the chosen client into the store + load.
  useEffect(() => {
    if (demo) {
      setClient(createMockVaultClient());
      void loadProjects();
    } else if (auth) {
      setClient(createLiveVaultClient(auth));
      void loadProjects();
    }
  }, [auth, demo, setClient, loadProjects]);

  if (phase.kind === "completing") {
    return (
      <div className="config-screen">
        <div className="config-card center">
          <h1>Connecting…</h1>
          <p className="muted">Exchanging the authorization code with your vault.</p>
        </div>
      </div>
    );
  }
  if (phase.kind === "approval") {
    return (
      <div className="config-screen">
        <div className="config-card center">
          <h1>Waiting for hub approval</h1>
          <p className="muted">
            Your hub admin needs to approve Adam's Cockpit before sign-in can complete. Approve,
            then connect again.
          </p>
          <a className="approve-link" href={phase.approveUrl} target="_blank" rel="noreferrer">
            Open approval page
          </a>
          <button className="ghost" onClick={() => setPhase({ kind: "none" })}>
            Back
          </button>
        </div>
      </div>
    );
  }
  if (!auth && !demo) {
    return (
      <ConfigScreen
        onConnected={adopt}
        onDemo={() => setDemo(true)}
        notice={phase.kind === "error" ? phase.message : undefined}
      />
    );
  }

  const label = demo ? "demo" : auth ? vaultSlug(auth.vaultBase) : "";
  return (
    <CockpitShell
      vaultLabel={label}
      onDisconnect={() => {
        clearSession();
        setAuth(null);
        setDemo(false);
        setClient(null);
      }}
    />
  );
}

function CockpitShell({ vaultLabel, onDisconnect }: { vaultLabel: string; onDisconnect: () => void }) {
  const view = useCockpit((s) => s.view);
  return (
    <div className="cockpit-root">
      <div className="vault-bar">
        <span className="vault-chip">vault · {vaultLabel}</span>
        <button className="ghost tiny" onClick={onDisconnect}>
          disconnect
        </button>
      </div>
      <div className="view-wrap">
        {view.screen === "home" ? <HomeScreen /> : <CanvasView slug={view.slug} />}
      </div>
    </div>
  );
}
