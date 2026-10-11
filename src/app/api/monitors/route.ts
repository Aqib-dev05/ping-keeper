import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Monitor } from "@/lib/models";
import { getUser } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import { validateUrl } from "@/lib/ping";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const monitors = await Monitor.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ monitors });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60);
  const intervalMin = Number(body.intervalMin);
  if (!name) return NextResponse.json({ error: "Give this monitor a name" }, { status: 400 });
  if (!LIMITS.intervals.includes(intervalMin)) return NextResponse.json({ error: "Pick a valid interval" }, { status: 400 });

  let url: string;
  try {
    url = (await validateUrl(String(body.url ?? "").trim())).toString();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  await connectDB();
  const count = await Monitor.countDocuments({ userId: user.id });
  if (count >= LIMITS.maxMonitors) {
    return NextResponse.json({ error: `Limit reached: ${LIMITS.maxMonitors} URLs per account` }, { status: 403 });
  }

  const monitor = await Monitor.create({ userId: user.id, name, url, intervalMin });
  return NextResponse.json({ monitor }, { status: 201 });
}
