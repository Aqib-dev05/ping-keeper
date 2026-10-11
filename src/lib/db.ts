import mongoose from "mongoose";

// Next.js dev mode mein hot reload se connections na barhein, isliye cache
const g = globalThis as unknown as { _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };
const cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  cache.promise ??= mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  cache.conn = await cache.promise;
  return cache.conn;
}
