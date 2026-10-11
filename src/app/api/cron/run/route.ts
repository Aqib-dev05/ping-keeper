import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Monitor, PingLog } from "@/lib/models";
import { pingUrl } from "@/lib/ping";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 25;
const TOLERANCE_MS = 90_000; // scheduler jitter ke liye

// Scheduler (GitHub Actions / cron-job.org) har 5 min isko call karta hai.
// Ye sirf wo monitors ping karta hai jinka time ho chuka hai.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = Date.now();
  const active = await Monitor.find({ active: true }).lean();
  const due = active.filter(
    (m) => !m.lastCheckedAt || now - m.lastCheckedAt.getTime() >= m.intervalMin * 60_000 - TOLERANCE_MS
  );

  let up = 0;
  for (let i = 0; i < due.length; i += BATCH) {
    await Promise.allSettled(
      due.slice(i, i + BATCH).map(async (m) => {
        const r = await pingUrl(m.url);
        if (r.ok) up++;
        await Promise.all([
          PingLog.create({ monitorId: m._id, ok: r.ok, status: r.status, responseMs: r.responseMs, error: r.error }),
          Monitor.updateOne(
            { _id: m._id },
            { lastOk: r.ok, lastStatus: r.status, lastResponseMs: r.responseMs, lastCheckedAt: new Date() }
          ),
        ]);
      })
    );
  }

  return NextResponse.json({ checked: due.length, up, down: due.length - up });
}
