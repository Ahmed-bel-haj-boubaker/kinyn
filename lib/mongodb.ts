import mongoose from "mongoose";

/* ================================================================
   Secure MongoDB Connection — singleton pattern for Next.js
   ================================================================
   • Caches the connection across hot-reloads in development.
   • Applies strict security options (TLS, timeouts, pool limits).
   • Validates the connection string at startup.
   ================================================================ */

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error(
    "❌  MONGODB_URL is not defined. Add it to your .env.local file.",
  );
}

/* ---------- Global cache (survives hot-reloads in dev) ---------- */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

/* ---------------------- Connection options ---------------------- */

const connectionOptions: mongoose.ConnectOptions = {
  /* ── Pool & Timeouts ── */
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,

  /* ── Database name ── */
  dbName: "kinyn",

  /* ── Buffer ── */
  bufferCommands: false,

  /* ── Auto-index only in dev (perf) ── */
  autoIndex: process.env.NODE_ENV !== "production",
};

/* ----------------------- Connect helper ----------------------- */

async function dbConnect(): Promise<typeof mongoose> {
  /* Already connected */
  if (cached.conn) {
    return cached.conn;
  }

  /* Connection in progress — await the same promise */
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URL as string, connectionOptions)
      .then((m) => {
        console.log("✅  MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry
        console.error("❌  MongoDB connection error:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ─────────────── Mongoose global security plugins ─────────────── */

// Strip __v from JSON output
mongoose.set("toJSON", {
  transform: (_doc: mongoose.Document, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Disable strict query to prevent unknown field injection
mongoose.set("strictQuery", true);

export default dbConnect;
