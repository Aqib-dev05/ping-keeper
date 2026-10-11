import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import { User } from "./models";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().delete("session");
}

export async function getUser(): Promise<{ id: string; email: string } | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    await connectDB();
    const user = await User.findById(payload.uid as string).lean();
    return user ? { id: user._id.toString(), email: user.email } : null;
  } catch {
    return null;
  }
}
