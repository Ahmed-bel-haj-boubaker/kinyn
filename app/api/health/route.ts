import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/* ================================================================
   GET /api/health
   ================================================================
   Returns the MongoDB connection status and server time.
   Useful for monitoring and deployment verification.
   ================================================================ */

export async function GET() {
  try {
    const mongoose = await dbConnect();

    const state = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json({
      status: "ok",
      database: stateMap[state] ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
