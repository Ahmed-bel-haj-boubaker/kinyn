import type { Server as SocketIOServer } from "socket.io";

/* ================================================================
   Socket.IO Configuration — KINYN
   ================================================================
   The Socket.IO instance is created in server.js and stored on
   globalThis.__socketIO. These helpers read from that global so
   the notification service can emit events at runtime.
   ================================================================ */

declare global {
  var __socketIO: SocketIOServer | undefined;
}

/**
 * Get the current Socket.IO instance (set by server.js).
 */
export function getIO(): SocketIOServer | null {
  return globalThis.__socketIO ?? null;
}

/**
 * Emit a notification to all admins in the admin room.
 */
export function emitToAdmins(event: string, data: unknown): void {
  const io = getIO();
  if (io) {
    io.to("admin-room").emit(event, data);
  }
}

/**
 * Emit a notification to a specific admin.
 */
export function emitToAdmin(
  adminId: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (io) {
    io.to(`admin:${adminId}`).emit(event, data);
  }
}
