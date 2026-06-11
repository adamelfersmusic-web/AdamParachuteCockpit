import type { VaultClient } from "./VaultClient";
import { MockVaultClient } from "./MockVaultClient";
import { RestVaultClient } from "./RestVaultClient";
import { GuardedVaultClient } from "./GuardedVaultClient";
import { seedNotes } from "./seed";
import { VaultApi } from "./parachute/api";
import type { AuthManager } from "./parachute/auth";

export * from "./VaultClient";
export { VaultGuardError, ReadOnlyError, isDeckTag } from "./guard";

function readOnlyFlag(): boolean {
  return String(import.meta.env.VITE_COCKPIT_READONLY ?? "") === "true";
}

// Demo / local: in-memory mock seeded from real notes. Firewall + dry-run wrap it.
export function createMockVaultClient(): VaultClient {
  return new GuardedVaultClient(new MockVaultClient(seedNotes()), { readOnly: readOnlyFlag() });
}

// Live: the connected Parachute vault over OAuth (Adam Deck's plumbing). Same
// Deck firewall + dry-run wrapper, so a frontend bug can never reach Deck data.
export function createLiveVaultClient(auth: AuthManager): VaultClient {
  return new GuardedVaultClient(new RestVaultClient(new VaultApi(auth)), {
    readOnly: readOnlyFlag(),
  });
}
