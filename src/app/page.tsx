import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();
  return (
    <div className="wrap">
      <nav className="nav">
        <Link href="/" className="logo">Ping<i>Keeper</i></Link>
        {user ? (
          <Link href="/dashboard" className="btn small">Dashboard</Link>
        ) : (
          <Link href="/login" className="btn ghost small">Log in</Link>
        )}
      </nav>

      <section className="hero">
        <h1>Your free server never sleeps.</h1>
        <p>
          Free hosts like Render shut your backend down after 15 minutes without traffic.
          PingKeeper sends it a request every few minutes, so the next visitor gets an instant response.
        </p>
        <div className="actions">
          {user ? (
            <Link href="/dashboard" className="btn">Open dashboard</Link>
          ) : (
            <>
              <Link href="/signup" className="btn">Create free account</Link>
              <Link href="/login" className="btn ghost">Log in</Link>
            </>
          )}
        </div>
        <svg className="pulse" viewBox="0 0 600 120" role="img" aria-label="Heartbeat line">
          <path d="M0 60 H120 L140 60 L155 20 L175 100 L192 60 H300 L318 60 L330 40 L345 80 L358 60 H600" />
        </svg>
      </section>

      <section className="facts">
        <div>
          <h3>Free, with no card</h3>
          <p>No plans and no payments. Every account gets up to 50 URLs checked every 5 to 60 minutes.</p>
        </div>
        <div>
          <h3>Works with any backend</h3>
          <p>It only sends an HTTP request, so Node, Python, PHP, Java, Go, .NET and Ruby apps all work.</p>
        </div>
        <div>
          <h3>See what happened</h3>
          <p>Each URL shows its last status, response time and recent up/down history.</p>
        </div>
      </section>
    </div>
  );
}
