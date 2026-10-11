import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Monitor, PingLog } from "@/lib/models";
import { LIMITS } from "@/lib/limits";
import Dashboard, { MonitorView } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  await connectDB();
  const monitors = await Monitor.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
  const views: MonitorView[] = await Promise.all(
    monitors.map(async (m) => {
      const logs = await PingLog.find({ monitorId: m._id }).sort({ createdAt: -1 }).limit(24).select("ok").lean();
      return {
        id: m._id.toString(),
        name: m.name,
        url: m.url,
        intervalMin: m.intervalMin,
        active: m.active,
        lastOk: m.lastOk,
        lastStatus: m.lastStatus,
        lastResponseMs: m.lastResponseMs,
        lastCheckedAt: m.lastCheckedAt ? m.lastCheckedAt.toISOString() : null,
        history: logs.map((l) => l.ok).reverse(),
      };
    })
  );

  return <Dashboard email={user.email} monitors={views} max={LIMITS.maxMonitors} intervals={LIMITS.intervals} />;
}
