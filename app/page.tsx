import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">SecurityScore</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:underline">
            Fiyatlandırma
          </Link>
          <Link href="/login" className="hover:underline">
            Giriş
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-1.5"
          >
            Başlayın
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Siber güvenlik riskini otomatik ölçün
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          DNS, DMARC, SSL Labs ve veri ihlali sinyallerini tek skorda birleştirin.
          PDF rapor ile paylaşın.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-2.5 text-sm font-medium"
          >
            Ücretsiz dene
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-medium"
          >
            Planlar
          </Link>
        </div>
      </main>
    </div>
  );
}
