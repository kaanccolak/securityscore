import { DomainForm } from "@/components/scan/DomainForm";

/** Vercel/Serverless: tüm tarayıcılar paralel; varsayılan ~10s fonksiyon limiti taramayı yarıda keser */
export const maxDuration = 60;

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Güvenlik taraması</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Alan adınız için DNS, TLS/sertifika, güvenlik başlıkları ve yapılandırılmışsa
          Have I Been Pwned kontrolleri çalıştırılır. Sonuçlar birkaç dakika sürebilir.
        </p>
      </div>
      <DomainForm />
    </div>
  );
}
