import { NextResponse } from "next/server";

/* ================================================================
   /api/socketio
   ================================================================
   Socket.IO handshake endpoint. 
   The actual WebSocket upgrade is handled by the custom server.
   This route exists so Next.js doesn't 404 on the path.
   ================================================================ */

export async function GET() {
  return NextResponse.json(
    { message: "Socket.IO endpoint — use WebSocket client to connect." },
    { status: 200 },
  );
}
