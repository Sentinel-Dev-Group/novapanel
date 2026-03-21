// ============================================================
//  authStore.js — Zustand auth state
//  Stores the current user, tokens and auth status.
//  Persists tokens to localStorage so login survives refresh.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      // ── Computed ───────────────────────────────────────────
      isAuthenticated: () => !!get().accessToken && !!get().user,
      isAdmin:         () => ["admin", "root"].includes(get().user?.role),

      // ── Actions ────────────────────────────────────────────
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        set({
          user:         null,
          accessToken:  null,
          refreshToken: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name:    "novapanel-auth",    // localStorage key
      partialize: (state) => ({    // only persist these fields
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);