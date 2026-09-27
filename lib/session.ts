import { User, AuthSession } from "@/types/auth";

const SESSION_STORAGE_KEY = "sentinel_auth_session";

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(user: User): AuthSession {
  const session: AuthSession = {
    user,
    loginTime: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function updateStoredUser(updates: Partial<User>): User | null {
  const current = getStoredSession();
  if (!current) return null;
  const updatedUser: User = {
    ...current.user,
    ...updates,
  };
  saveSession(updatedUser);
  return updatedUser;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
