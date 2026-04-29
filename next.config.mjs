/** @type {import('next').NextConfig} */
// Dış HTTP: Next.js/Vercel’de fetch için özel URL engeli yok (kurumsal proxy hariç).
// Vercel Serverless’te asıl sınır genelde fonksiyon maxDuration’dır; tarama route/sayfada 60s.
const nextConfig = {};

export default nextConfig;
