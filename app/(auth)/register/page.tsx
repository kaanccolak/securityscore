import Link from "next/link";
import { RegisterForm } from "@/components/marketing/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold">Kayıt</h1>
        <p className="text-sm text-slate-500 mt-1">Yeni bir hesap oluşturun.</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-slate-500">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="underline">
          Giriş
        </Link>
      </p>
    </div>
  );
}
