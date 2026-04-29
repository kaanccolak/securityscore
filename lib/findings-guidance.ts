import type { Finding } from "@/types/scan";

export interface FindingGuidance {
  remediation: string;
  risk: string;
}

/** KOBİ dilinde, teknik jargon az */
const BY_ID: Record<string, FindingGuidance> = {
  "info-positive-summary": {
    remediation:
      "Bu ayarları koruyun; barındırıcı veya CDN değişikliğinden sonra güvenlik başlıklarını ve DNS kayıtlarını yeniden doğrulayın.",
    risk: "Başlıklar veya SPF/DMARC yanlışlıkla kaldırılırsa site ve e-posta güvenliği zayıflayabilir.",
  },
  "dns-no-dmarc": {
    remediation:
      "Domain sağlayıcınızın DNS panelinden _dmarc TXT kaydı ekleyin veya BT ekibinizden isteyin.",
    risk: "Saldırganlar şirketiniz adına sahte e-posta gönderebilir. Müşterileriniz dolandırılabilir, itibarınız zedelenir.",
  },
  "dns-no-spf": {
    remediation:
      "E-posta sağlayıcınızın (Gmail, Outlook vb.) verdiği SPF kaydını DNS ayarlarınıza ekleyin.",
    risk: "E-postalarınız spam kutusuna düşebilir veya sahte e-postalar sizden geliyormuş gibi gösterilebilir.",
  },
  "dns-dmarc-soft": {
    remediation:
      "DMARC kaydınızı güçlendirin: şüpheli postaların en azından karantinaya alınması veya reddedilmesi için politika ayarlayın. BT veya domain sağlayıcınızdan yardım isteyin.",
    risk: "Zayıf DMARC ile sahte e-postalar uzun süre fark edilmeden iletilebilir; müşteri güveni zarar görebilir.",
  },
  "dns-no-mx": {
    remediation: "DNS panelinden e-posta sağlayıcınıza ait MX kaydını ekleyin.",
    risk: "Şirketinize gönderilen e-postalar ulaşmayabilir, iş iletişiminiz kesintiye uğrayabilir.",
  },
  "dns-no-a": {
    remediation:
      "Domain sağlayıcınızdan sitenizin doğru sunucu adresine (A veya AAAA kaydı) yönlendirildiğini kontrol ettirin.",
    risk: "Siteniz ziyaretçilere açılmıyor olabilir. Bu durum iş kaybına ve güvenilirlik sorununa yol açar.",
  },
  "ssl-grade-weak": {
    remediation:
      "Hosting sağlayıcınızdan SSL sertifikanızı güncel ve güvenli ayarlarla yapılandırmasını isteyin. Birçok sağlayıcı Let's Encrypt ile ücretsiz ve güçlü sertifika sunar.",
    risk: "Müşterilerinizin tarayıcısı sitenizi güvensiz gösterebilir. Ödeme ve giriş bilgileri gibi verilerin ele geçirilme riski artar.",
  },
  "ssl-cert-issues": {
    remediation:
      "SSL sertifikanızın süresi, zinciri ve sunucu ayarları için hosting veya BT ekibinizden kontrol ve gerekirse yenileme isteyin.",
    risk: "Ziyaretçiler uyarılı sayfalar görebilir; iletişim ve alışveriş güveni zedelenir, saldırganlar araya girebilir.",
  },
  "ssl-labs-http": {
    remediation: "SSL testi yanıt vermedi; hosting firmanızdan site ve güvenlik duvarı ayarlarını kontrol ettirin.",
    risk: "Gerçek şifreleme durumunuz net değil; zayıf veya hatalı kurulum müşteri güvenini zedeler.",
  },
  "ssl-labs-assess-error": {
    remediation: "Hosting veya BT ekibinizden SSL yapılandırmasını ve erişilebilirliği düzeltmesini isteyin.",
    risk: "Bağlantı güvenliği sorunları devam ederse tarayıcı uyarıları ve veri riski sürer.",
  },
  "ssl-labs-timeout": {
    remediation: "Sunucunuzun dışarıdan erişilebilir olduğunu ve SSL’in düzgün açıldığını hosting ile doğrulayın.",
    risk: "Test tamamlanamadı; zayıf SSL veya kesinti müşteri kaybına yol açabilir.",
  },
  "ssl-labs-no-endpoint": {
    remediation: "Alan adınızın doğru sunucuya işaret ettiğini ve HTTPS’in açık olduğunu sağlayıcınızla kontrol edin.",
    risk: "Ziyaretçiler güvenli bağlantı kuramayabilir; güven ve SEO olumsuz etkilenir.",
  },
  "ssl-labs-exception": {
    remediation: "BT veya hosting desteğinden SSL ve site erişimini kontrol ettirin.",
    risk: "Şifreleme durumu belirsiz kalır; müşteri güveni ve uyumluluk riskleri artabilir.",
  },
  "headers-unreachable": {
    remediation: "Sitenizin açık ve erişilebilir olduğunu, güvenlik duvarı veya bakım modunun kapalı olduğunu hosting ile doğrulayın.",
    risk: "Dışarıdan güvenlik kontrolü yapılamıyor; sorun devam ederse müşteri ve güvenlik açısından kör nokta kalır.",
  },
  "headers-http-status": {
    remediation: "Ana sayfanızın düzgün yanıt verdiğini ve yönlendirmelerin doğru olduğunu teknik ekipten kontrol ettirin.",
    risk: "Hatalı yanıtlar hem ziyaretçi kaybına hem güvenlik başlıklarının eksik kalmasına yol açabilir.",
  },
  "hibp-clean": {
    remediation: "Şifreleri ve çok faktörlü doğrulamayı kurumsal politikanıza göre sürdürün.",
    risk: "Gelecekte oluşabilecek ihlaller için düzenli kontrol ve eğitim önemlidir.",
  },
  "hibp-http": {
    remediation: "API anahtarınızı ve bağlantınızı kontrol edin; gerekirse daha sonra yeniden tarayın.",
    risk: "İhlal verisi alınamadı; gerçek durum bilinmeden kalabilir.",
  },
  "hibp-more": {
    remediation:
      "Listelenen tüm ihlallerde geçen hesaplar için şifre değişimi ve çok faktörlü doğrulama uygulayın.",
    risk: "Birden fazla sızıntı birikmiş olabilir; tek bir zayıf hesap kurumsal erişime yol açabilir.",
  },
  "hibp-exception": {
    remediation: "Bağlantıyı daha sonra tekrar deneyin veya BT ekibinden yardım isteyin.",
    risk: "İhlal bilgisi alınamazsa önlem almak gecikebilir.",
  },
  "whoapi-error": {
    remediation: "API anahtarı ve kota durumunu WhoAPI hesabınızdan kontrol edin.",
    risk: "Kayıt tarihi bilgisi eksik kalır; dolandırıcılık açısından faydalı bir sinyal kaçabilir.",
  },
  "whoapi-no-date": {
    remediation: "Farklı bir TLD veya sağlayıcıda WHOIS bilgisinin gelip gelmediğini BT ile doğrulayın.",
    risk: "Yaş analizi yapılamadığı için yeni alan adı uyarısı verilemeyebilir.",
  },
  "whoapi-bad-date": {
    remediation: "WHOIS verisinin doğruluğunu domain sağlayıcınızdan teyit edin.",
    risk: "Yanlış tarih yanıltıcı risk puanına yol açabilir.",
  },
  "whoapi-very-new": {
    remediation:
      "Alan adını yeni aldıysanız kimlik ve ödeme süreçlerinizi gözden geçirin; müşterilerinize güven veren kanıtlar sunun.",
    risk: "Çok yeni alan adları sahte sitelerde sık kullanılır; müşteriler şüphe edebilir veya dolandırılabilir.",
  },
  "whoapi-new": {
    remediation: "Markanızı güçlendirin; iletişim bilgilerinizin ve yasal metinlerinizin sitede açık olduğundan emin olun.",
    risk: "Kısa süreli kayıtlar güven tazelemek için ek çaba gerektirir.",
  },
  "whoapi-age-ok": {
    remediation: "Yenileme tarihlerini takvimde tutun; süresi dolan domain işinizi durdurur.",
    risk: "Domain süresi dolarsa site ve e-posta kesilir; itibar ve gelir kaybı yaşanır.",
  },
  "whoapi-expiring": {
    remediation: "Domain yenilemesini hemen yapın veya otomatik yenilemeyi açın.",
    risk: "Süre dolarsa site kapanır; domain ele geçirilme ve dolandırıcılık riski doğar.",
  },
  "whoapi-exception": {
    remediation: "Daha sonra tekrar taratın veya BT desteği alın.",
    risk: "Yaş bilgisi olmadan risk değerlendirmesi eksik kalır.",
  },
  "dns-dmarc-ok": {
    remediation: "DMARC raporlarını düzenli okuyun; politika gerektiğinde sıkılaştırılabilir.",
    risk: "Yapılandırma değişirse e-posta güvenliği zayıflayabilir.",
  },
  "dns-spf-ok": {
    remediation: "E-posta sağlayıcı değişirse SPF kaydını güncelleyin.",
    risk: "Kayıt güncellenmezse teslimat ve güven sorunları başlar.",
  },
  "ssl-grade-good": {
    remediation: "Sertifika yenilemelerini takip edin; mümkünse otomatik yenileme kullanın.",
    risk: "Süresi dolan sertifika ziyaretçilere uyarı gösterir.",
  },
  "ssl-summary": {
    remediation: "SSL ayarlarını büyük güncellemelerden sonra yeniden test ettirin.",
    risk: "Yapılandırma kayması güveni düşürebilir.",
  },
};

const HIBP_BREACH: FindingGuidance = {
  remediation:
    "İhlalde görünen e-posta ve hesaplar için şifreleri hemen değiştirin; mümkünse çok faktörlü doğrulamayı açın.",
  risk: "Çalınan veya sızmış şifreler kurumsal sistemlere yetkisiz girişte kullanılabilir. Veri sızıntısı ve maddi zarar riski artar.",
};

const ROBOTS_SENSITIVE: FindingGuidance = {
  remediation:
    "robots.txt içinde admin, yedek veya iç dizinlere dair gereksiz ipuçlarını kaldırın; bu alanları şifre veya erişim kuralı ile koruyun.",
  risk: "Saldırganlar yönetim sayfalarınızı ve yedeklerinizi daha kolay keşfedebilir; site ve veri güvenliği zedelenir.",
};

const HTTP_HEADERS_GAP: FindingGuidance = {
  remediation:
    "Web geliştiricinize X-Frame-Options ve Content-Security-Policy gibi güvenlik başlıklarını eklemesini söyleyin.",
  risk: "Siteniz kandırmaca (clickjacking) ve kötü amaçlı kod yüklenmesine karşı daha savunmasız kalır; ziyaretçiler zararlı içeriğe yönlendirilebilir.",
};

const POSITIVE_INFO: FindingGuidance = {
  remediation: "Şu an uygun görünüyor; hosting veya yazılım güncellemelerinden sonra ayarların korunduğunu kontrol ettirin.",
  risk: "Bu koruma kaldırılırsa veya yanlışlıkla değiştirilirse ilgili riskler yeniden ortaya çıkabilir.",
};

const GENERIC: FindingGuidance = {
  remediation:
    "Bu konuda domain, hosting veya BT sorumlunuzdan destek isteyin; rapordaki açıklamayı onlarla paylaşın.",
  risk: "Giderilmezse güvenlik açığı veya itibar kaybı büyüyebilir; müşteri güveni ve iş sürekliliği etkilenebilir.",
};

const HIBP_STATIC = new Set([
  "hibp-clean",
  "hibp-http",
  "hibp-more",
  "hibp-exception",
]);

const HEADER_PRESENT = new Set([
  "headers-csp-present",
  "headers-xfo-present",
  "headers-xss-present",
  "headers-xcto-present",
  "headers-hsts-present",
]);

const HEADER_GAPS = new Set([
  "headers-no-csp",
  "headers-no-xfo",
  "headers-no-xss",
  "headers-no-xcto",
  "headers-no-hsts",
]);

export function getFindingGuidance(finding: Finding): FindingGuidance {
  const { id } = finding;

  if (HEADER_PRESENT.has(id)) {
    return POSITIVE_INFO;
  }

  if (HEADER_GAPS.has(id)) {
    return HTTP_HEADERS_GAP;
  }

  if (id.startsWith("robots-sensitive-")) {
    return ROBOTS_SENSITIVE;
  }

  if (BY_ID[id]) {
    return BY_ID[id];
  }

  if (id.startsWith("hibp-") && !HIBP_STATIC.has(id)) {
    return HIBP_BREACH;
  }

  return GENERIC;
}
