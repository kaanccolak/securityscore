import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="text-3xl font-semibold mt-6">Fiyatlandırma</h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2">
        Ücretsiz katman ile başlayın; Pro için iyzico ile ödeme alın.
      </p>
      <div className="grid sm:grid-cols-2 gap-6 mt-10">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-medium text-lg">Ücretsiz</h2>
          <p className="text-3xl font-semibold mt-2">₺0</p>
          <ul className="mt-4 text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li>Temel taramalar</li>
            <li>Skor ve bulgular</li>
            <li>PDF dışa aktarım</li>
          </ul>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Kayıt ol
          </Link>
        </div>
        <div className="rounded-xl border border-slate-900 dark:border-slate-100 p-6">
          <h2 className="font-medium text-lg">Pro</h2>
          <p className="text-3xl font-semibold mt-2">₺99 / ay</p>
          <ul className="mt-4 text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li>Öncelikli kuyruk (yakında)</li>
            <li>API anahtarları ile tam entegrasyon</li>
            <li>E-posta desteği</li>
          </ul>
          <Link
            href="/billing"
            className="mt-6 inline-block rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium"
          >
            Faturalama
          </Link>
        </div>
      </div>
    </div>
  );
}
