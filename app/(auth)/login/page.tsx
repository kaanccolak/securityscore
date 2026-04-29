import Link from "next/link";
import { LoginForm } from "@/components/marketing/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return (
    <div className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold">Giriş</h1>
        <p className="text-sm text-slate-500 mt-1">SecurityScore hesabınıza giriş yapın.</p>
      </div>
      {searchParams.error && (
        <p className="text-sm text-red-600">Kimlik doğrulama başarısız.</p>
      )}
      <LoginForm redirectTo={searchParams.redirect} />
      <p className="text-sm text-slate-500">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
