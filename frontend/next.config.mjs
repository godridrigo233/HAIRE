/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  env: {
    // Fallback cuando NEXT_PUBLIC_API_URL no está configurado en Vercel.
    // En producción, define NEXT_PUBLIC_API_URL en el dashboard de Vercel.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "https://haire-j0rx.onrender.com",
  },
}

export default nextConfig
