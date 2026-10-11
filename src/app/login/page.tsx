import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function Page() {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="wrap">
      <nav className="nav"><Link href="/" className="logo">Ping<i>Keeper</i></Link></nav>
      <AuthForm mode="login" />
    </div>
  );
}
