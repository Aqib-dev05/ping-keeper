import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  await connectDB();
  try {
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 10) });
    await createSession(user._id.toString());
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 11000) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    throw e;
  }
}
