/** @type {import('next').NextConfig} */
// Dış HTTP: Next.js/Vercel’de fetch için özel URL engeli yok (kurumsal proxy hariç).
// maxDuration next.config içinde export edilemez; app/api/scans/route.ts ve vercel.json kullanılıyor.
const nextConfig = {};

export default nextConfig;
