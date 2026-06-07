import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đánh dấu các thư viện native Node.js/Server-side là external để Next.js 16/Turbopack 
  // không bundle chúng, tránh lỗi runtime engine của Prisma 7 và Bcryptjs
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
