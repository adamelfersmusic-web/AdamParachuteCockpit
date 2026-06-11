import type { AuthManager } from "./auth";
import type { Note, TagInfo } from "./types";

// Thrown for any non-OK response. `conflict` flags the optimistic-concurrency
// case (the note changed since we last read it) so the UI can prompt a reload.
// Lifted from Adam Deck's proven vault client.
export class ApiError extends Error {
  status: number;
  conflict: boolean;
  constructor(message: string, status: number, conflict = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.conflict = conflict;
  }
}

function snippet(content: string): string {
  return content.replace(/[#*_>`-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

function humanizeTitle(path: string): string {
  const base = path.split("/").pop() || path;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\.\w+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeNote(raw: any): Note {
  const path: string = raw.path ?? raw.id ?? "";
  return {
    id: raw.id ?? raw.path,
    path,
    title: humanizeTitle(path || String(raw.id ?? "untitled")),
    content: raw.content,
    preview: raw.preview ?? (raw.content ? snippet(raw.content) : undefined),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
    links: raw.links,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
    byteSize: raw.byteSize ?? raw.byte_size,
  };
}

function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function unwrapOne(data: any): any {
  return data?.note ?? data?.data ?? data;
}

export class VaultApi {
  private auth: AuthManager;

  constructor(auth: AuthManager) {
    this.auth = auth;
  }

  private async send(path: string, init: RequestInit, token: string): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    try {
      return await fetch(`${this.auth.vaultBase}/api${path}`, { ...init, headers });
    } catch {
      throw new ApiError(
        "Could not reach the vault. Check the URL, your network, and that the vault allows cross-origin requests.",
        0,
      );
    }
  }

  private async request(path: string, init: RequestInit = {}): Promise<any> {
    let token = await this.auth.getAccessToken();
    let res = await this.send(path, init, token);

    if (res.status === 401 && (await this.auth.tryRefresh())) {
      token = await this.auth.getAccessToken();
      res = await this.send(path, init, token);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const conflict = res.status === 409 || /conflict|updated_at|precondition/i.test(text);
      const detail = text ? `: ${text.slice(0, 300)}` : "";
      throw new ApiError(`${res.status} ${res.statusText}${detail}`, res.status, conflict);
    }

    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return res.text();
    return res.json();
  }

  async search(query: string, limit = 100): Promise<Note[]> {
    const data = await this.request(
      `/notes?search=${encodeURIComponent(query)}&include_content=false&limit=${limit}`,
    );
    return unwrapList(data).map(normalizeNote);
  }

  async queryNotes(
    opts: {
      tag?: string;
      pathPrefix?: string;
      includeContent?: boolean;
      limit?: number;
    } = {},
  ): Promise<Note[]> {
    const { tag, pathPrefix, includeContent = false, limit = 200 } = opts;
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (pathPrefix) params.set("path_prefix", pathPrefix);
    params.set("include_content", String(includeContent));
    params.set("limit", String(limit));
    const data = await this.request(`/notes?${params.toString()}`);
    return unwrapList(data).map(normalizeNote);
  }

  async getNote(idOrPath: string): Promise<Note> {
    const data = await this.request(`/notes/${encodePathSegment(idOrPath)}`);
    return normalizeNote(unwrapOne(data));
  }

  async createNote(input: {
    path?: string;
    content: string;
    tags: string[];
    metadata?: Record<string, unknown>;
  }): Promise<Note> {
    const data = await this.request(`/notes`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizeNote(unwrapOne(data));
  }

  // PATCH with optimistic concurrency. `tags` is a full replace; `metadata` is
  // merged server-side. The vault REQUIRES a precondition: pass `ifUpdatedAt`
  // from the note you read, OR `force: true` for last-write-wins.
  async updateNote(
    idOrPath: string,
    patch: {
      content?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      path?: string;
      ifUpdatedAt?: string;
      force?: boolean;
    },
  ): Promise<Note> {
    const body: Record<string, unknown> = {};
    if (patch.content !== undefined) body.content = patch.content;
    if (patch.tags !== undefined) body.tags = patch.tags;
    if (patch.metadata !== undefined) body.metadata = patch.metadata;
    if (patch.path !== undefined) body.path = patch.path;
    if (patch.ifUpdatedAt) body.if_updated_at = patch.ifUpdatedAt;
    if (patch.force) body.force = true;

    const data = await this.request(`/notes/${encodePathSegment(idOrPath)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return normalizeNote(unwrapOne(data));
  }

  async listTags(): Promise<TagInfo[]> {
    const data = await this.request(`/tags`);
    const arr = unwrapList(data).length ? unwrapList(data) : (data?.tags ?? []);
    return (Array.isArray(arr) ? arr : []).map((t: any) => ({
      name: typeof t === "string" ? t : t.name,
      count: typeof t === "object" ? (t.count ?? 0) : 0,
    }));
  }
}

// Note IDs/paths can contain slashes; the route is /api/notes/:idOrPath, so
// encode each segment but keep the slashes.
function encodePathSegment(idOrPath: string): string {
  return idOrPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
