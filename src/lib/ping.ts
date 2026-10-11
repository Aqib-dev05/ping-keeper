import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIp(ip: string) {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

// SSRF protection: users ke diye URL ko hamara server hit karta hai,
// isliye localhost / private network wale URLs block hain.
export async function validateUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Sirf http/https URLs allowed hain");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private URLs allowed nahi hain");
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("Private URLs allowed nahi hain");
  return u;
}

export async function pingUrl(url: string) {
  const start = Date.now();
  try {
    await validateUrl(url);
    // redirect manual: redirect kisi private address pe na le ja sake.
    // Server ko wake karne ke liye response aana hi kafi hai.
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
      headers: { "User-Agent": "PingKeeper/1.0 (+uptime monitor)" },
    });
    return { ok: res.status < 500, status: res.status as number | null, responseMs: Date.now() - start, error: null as string | null };
  } catch (e: any) {
    return { ok: false, status: null as number | null, responseMs: Date.now() - start, error: String(e?.message ?? e).slice(0, 200) };
  }
}
