import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google";

const font = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata = {
  title: "PingKeeper: keep your free server awake",
  description: "Free uptime pinger. Sends a request to your backend every few minutes so free hosts never put it to sleep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
