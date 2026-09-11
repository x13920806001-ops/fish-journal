/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'koivpdwfagxgguayajpb.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;