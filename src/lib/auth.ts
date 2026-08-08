const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8787"
).replace(/\/+$/, "");
const ACCESS_TOKEN_KEY = "zenpad-access-token";
const REFRESH_TOKEN_KEY = "zenpad-refresh-token";

type User = { id: string; email: string; name: string; plan: "free" | "pro" };
type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
};
type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};

const listeners = new Set<(session: Session | null) => void>();
let currentSession: Session | null = null;
let refreshPromise: Promise<Session | null> | null = null;

const notify = () => listeners.forEach((listener) => listener(currentSession));

const storeSession = (response: AuthResponse): Session => {
  currentSession = {
    access_token: response.accessToken,
    refresh_token: response.refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + response.expiresIn,
    user: response.user,
  };
  localStorage.setItem(ACCESS_TOKEN_KEY, currentSession.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, currentSession.refresh_token);
  notify();
  return currentSession;
};

const clearSession = () => {
  currentSession = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notify();
};

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.message || payload.error || `Request failed (${response.status})`,
    );
  }
  return payload as T;
}

async function refreshSession(): Promise<Session | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = request<AuthResponse>("/auth/refresh", { refreshToken })
      .then(storeSession)
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const authResult = async (operation: () => Promise<AuthResponse>) => {
  try {
    const response = await operation();
    const session = storeSession(response);
    return { data: { session, user: session.user }, error: null };
  } catch (error) {
    return { data: { session: null, user: null }, error: error as Error };
  }
};

export async function signUp(
  email: string,
  password: string,
  metadata?: { name?: string },
) {
  return authResult(() =>
    request<AuthResponse>("/auth/register", {
      email,
      password,
      name: metadata?.name || "",
    }),
  );
}

export async function signIn(email: string, password: string) {
  return authResult(() =>
    request<AuthResponse>("/auth/login", { email, password }),
  );
}

export async function signOut() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  clearSession();
  if (!refreshToken) return { error: null };
  try {
    await request("/auth/logout", { refreshToken });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getSession() {
  if (currentSession && currentSession.expires_at > Date.now() / 1000 + 30) {
    return { data: { session: currentSession }, error: null };
  }
  const session = await refreshSession();
  return { data: { session }, error: null };
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSession();
  return data.session?.access_token ?? null;
}

export async function resetPassword(_email: string) {
  return {
    error: new Error(
      "Password reset is not available yet. Contact support to recover your account.",
    ),
  };
}

export function onAuthStateChange(cb: (session: Session | null) => void) {
  listeners.add(cb);
  return { unsubscribe: () => listeners.delete(cb) };
}
