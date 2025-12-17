import { create } from "zustand";
import { apiClient } from "@/shared/lib/api-client";
import {
  mockLogin,
  mockRegister,
  mockListPendingUsers,
  mockApproveUser,
  mockRejectUser,
  mockLoadSession,
} from "@/shared/lib/auth-service";
import type {
  AppUser,
  AuthSession,
  LoginPayload,
  PendingUser,
  RegistrationPayload,
} from "@/shared/types/user";

const SESSION_KEY = "pest-i-session";

type AuthStatus = "idle" | "loading" | "pending-review" | "authenticated" | "error";

interface AuthState {
  user: AppUser | null;
  token: string | null;
  status: AuthStatus;
  pendingUsers: PendingUser[];
  error?: string;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  register: (payload: RegistrationPayload) => Promise<void>;
  loadPendingUsers: () => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string) => Promise<void>;
  updateUser: (user: AppUser) => void;
}

// Mock usage removed


const persistSession = (session: AuthSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const readSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "idle",
  pendingUsers: [],
  error: undefined,
  initialize: async () => {
    const session = readSession();
    if (!session) {
      set({ user: null, token: null, status: "idle" });
      return;
    }
    set({ status: "loading" });
    try {
      let restored: AuthSession | null = null;
      // Verify token with real API
      try {
        const response = await apiClient.get<{ user: AppUser }>("/user/me");
        restored = {
          token: session.token,
          user: response.user,
        };
      } catch (error) {
        // Token is invalid, clear session
        restored = null;
      }

      if (!restored) {
        persistSession(null);
        set({ user: null, token: null, status: "idle" });
        return;
      }
      persistSession(restored);
      set({
        user: restored.user,
        token: restored.token,
        status: restored.user.status === "approved" ? "authenticated" : "pending-review",
      });
    } catch (error) {
      persistSession(null);
      set({
        user: null,
        token: null,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to restore session",
      });
    }
  },
  login: async (payload: LoginPayload) => {
    set({ status: "loading", error: undefined });
    try {
      // #region agent log
      // #endregion
      // #region agent log
      // #endregion
      const session = await apiClient.post<AuthSession>("/auth/login", payload);
      persistSession(session);
      set({
        user: session.user,
        token: session.token,
        status: session.user.status === "approved" ? "authenticated" : "pending-review",
      });
      // #region agent log
      // #endregion
      // #region agent log
      // #endregion
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      set({
        status: "error",
        error: message,
      });
      // #region agent log
      // #endregion
      // #region agent log
      // #endregion
      throw new Error(message);
    }
  },
  logout: () => {
    persistSession(null);
    set({ user: null, token: null, status: "idle", error: undefined });
  },
  register: async (payload: RegistrationPayload) => {
    set({ status: "loading", error: undefined });
    try {
      await apiClient.post("/auth/register", payload);
      set({ status: "pending-review" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      set({
        status: "error",
        error: message,
      });
      throw new Error(message);
    }
  },
  loadPendingUsers: async () => {
    set({ error: undefined });
    try {
      const pending = await apiClient.get<PendingUser[]>("/admin/pending-users");
      set({ pendingUsers: pending });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load pending users",
      });
    }
  },
  approveUser: async (id: string) => {
    await apiClient.post(`/admin/pending-users/${id}/approve`);
    await get().loadPendingUsers();
  },
  rejectUser: async (id: string) => {
    await apiClient.post(`/admin/pending-users/${id}/reject`);
    await get().loadPendingUsers();
  },
  updateUser: (nextUser: AppUser) => {
    set({ user: nextUser });
    const session = readSession();
    if (session) {
      persistSession({ ...session, user: nextUser });
    }
  },
}));

