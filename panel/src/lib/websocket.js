// ============================================================
//  websocket.js — Socket.io client instance export
//  Import this if you need direct socket access outside hooks
// ============================================================

import { io } from "socket.io-client";

const socket = io("/", {
  autoConnect:       true,
  reconnection:      true,
  reconnectionDelay: 1000,
});

export default socket;