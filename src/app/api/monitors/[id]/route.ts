import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Monitor, PingLog } from "@/lib/models";
import { getUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  await connectDB();
  const res = await Monitor.updateOne({ _id: params.id, userId: user.id }, { active: Boolean(body.active) });
  if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await connectDB();
  const res = await Monitor.deleteOne({ _id: params.id, userId: user.id });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await PingLog.deleteMany({ monitorId: params.id }); // MongoDB mein cascade nahi hota
  return NextResponse.json({ ok: true });
}
