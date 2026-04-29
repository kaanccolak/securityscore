import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/SignOutButton";

const nav = [
  { href: "/dashboard", label: "Panel" },
  { href: "/scan", label: "Tarama" },
  { href: "/reports", label: "Raporlar" },
  { href: "/billing", label: "Faturalama" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)] text-[var(--foreground)]">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex md:flex-col gap-4 md:gap-6">
        <Link href="/dashboard" className="font-semibold text-lg">
          SecurityScore
        </Link>
        <nav className="flex md:flex-col flex-wrap gap-2 md:gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="md:mt-auto text-xs text-slate-500 truncate">
          {user?.email}
        </div>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-5xl w-full">{children}</main>
    </div>
  );
}
