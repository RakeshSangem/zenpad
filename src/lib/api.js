import { getAccessToken } from "./auth";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8787"
).replace(/\/+$/, "");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Max notes per push request — matches the backend's batch cap.
const MAX_BATCH = 50;

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) {
    const err = new Error("no_session");
    err.code = "no_session";
    throw err;
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseOrThrow(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `http_${res.status}`);
    err.status = res.status;
    err.code = body.error;
    throw err;
  }
  return body;
}

// Map a store-shaped note to the backend's note schema.
function toApiNote(n) {
  return {
    id: n.id,
    title: n.title ?? "",
    content: n.content ?? "",
    document: n.document ?? null,
    format_version: n.formatVersion ?? 1,
    is_deleted: n.isDeleted ?? false,
    updated_at: n.updatedAt,
  };
}

export async function syncPush(notes) {
  const payload = notes
    .filter((n) => UUID_RE.test(n.id))
    .slice(0, MAX_BATCH)
    .map(toApiNote);
  if (payload.length === 0) {
    return { accepted: [], skipped: [], skipped_local: notes.length };
  }
  const res = await fetch(`${API_BASE}/sync/push`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ notes: payload }),
  });
  return parseOrThrow(res);
}

export async function syncPull(since = null, limit = 500) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (since) params.set("since", since);
  const res = await fetch(`${API_BASE}/sync/pull?${params}`, {
    headers: await authHeaders(),
  });
  return parseOrThrow(res);
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/me`, { headers: await authHeaders() });
  return parseOrThrow(res);
}
