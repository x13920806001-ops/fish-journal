/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'koivpdwfagxgguayajpb.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;