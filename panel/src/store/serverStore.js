// ============================================================
//  serverStore.js — Zustand server state
//  Stores the list of servers and selected server.
// ============================================================

import { create } from "zustand";

export const useServerStore = create((set) => ({
  // ── State ────────────────────────────────────────────────
  servers:        [],
  selectedServer: null,
  isLoading:      false,
  error:          null,

  // ── Actions ──────────────────────────────────────────────
  setServers: (servers) => set({ servers }),

  setSelectedServer: (server) => set({ selectedServer: server }),

  updateServerStatus: (uuid, status) => set((state) => ({
    servers: state.servers.map((s) =>
      s.uuid === uuid ? { ...s, status } : s
    ),
    selectedServer:
      state.selectedServer?.uuid === uuid
        ? { ...state.selectedServer, status }
        : state.selectedServer,
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)     => set({ error }),
}));