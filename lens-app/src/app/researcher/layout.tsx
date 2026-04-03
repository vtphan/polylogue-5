import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "researcher") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Researcher</h1>
          <nav className="flex gap-1">
            <NavLink href="/researcher">Dashboard</NavLink>
            <NavLink href="/researcher/explorer">Explorer</NavLink>
            <NavLink href="/researcher/observatory">Observatory</NavLink>
          </nav>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
