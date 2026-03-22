// ============================================================
//  useWebSocket.js — Socket.io connection hook
//  Manages the WebSocket connection and console streaming.
//  Call this once at the app level or per page that needs it.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { io }            from "socket.io-client";
import { useAuthStore }  from "../store/authStore";

// Singleton socket instance — shared across the app
let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io("/", {
      autoConnect:     true,
      reconnection:    true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
}

// ── useWebSocket ──────────────────────────────────────────────
//  General hook for socket connection status
export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    function onConnect()    { setConnected(true);  }
    function onDisconnect() { setConnected(false); }

    socket.on("connect",    onConnect);
    socket.on("disconnect", onDisconnect);

    setConnected(socket.connected);

    return () => {
      socket.off("connect",    onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { connected };
}

// ── useServerConsole ──────────────────────────────────────────
//  Hook for streaming a specific server's console output
//  Usage: const { lines, sendCommand, connected } = useServerConsole(serverUuid)
export function useServerConsole(serverId) {
  const [lines,     setLines]     = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef                 = useRef(null);

  // ── Connect and subscribe ────────────────────────────────
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();
    socketRef.current = socket;

    function onConnect() {
      setConnected(true);
      // Subscribe to this server's console room
      socket.emit("console:subscribe", { serverId });
    }

    function onDisconnect() {
      setConnected(false);
      setLines((prev) => [
        ...prev,
        {
          type: "warn",
          text: "Connection lost — attempting to reconnect...",
          time: new Date().toISOString(),
        },
      ]);
    }

    function onReconnect() {
      setConnected(true);
      socket.emit("console:subscribe", { serverId });
      setLines((prev) => [
        ...prev,
        {
          type: "success",
          text: "Reconnected to console",
          time: new Date().toISOString(),
        },
      ]);
    }

    function onConsoleLine(data) {
      if (data.serverId !== serverId) return;
      setLines((prev) => {
        // Keep last 500 lines to avoid memory issues
        const updated = [...prev, data];
        return updated.length > 500 ? updated.slice(-500) : updated;
      });
    }

    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("reconnect",     onReconnect);
    socket.on("console:line",  onConsoleLine);

    // If already connected subscribe immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit("console:subscribe", { serverId });
    }

    // ── Cleanup ────────────────────────────────────────────
    return () => {
      socket.emit("console:unsubscribe", { serverId });
      socket.off("connect",      onConnect);
      socket.off("disconnect",   onDisconnect);
      socket.off("reconnect",    onReconnect);
      socket.off("console:line", onConsoleLine);
    };
  }, [serverId]);

  // ── Send a command ───────────────────────────────────────
  const sendCommand = useCallback((command) => {
    if (!command?.trim() || !socketRef.current) return;
    socketRef.current.emit("console:command", {
      serverId,
      command: command.trim(),
    });
  }, [serverId]);

  // ── Clear console ────────────────────────────────────────
  const clearConsole = useCallback(() => {
    setLines([]);
  }, []);

  return { lines, connected, sendCommand, clearConsole };
}