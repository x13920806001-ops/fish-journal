/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许加载 Supabase 存储里的图片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'koivpdwfagxgguayajpb.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;