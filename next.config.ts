import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100MB",
    },
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage signed URLs (image thumbnails)
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // Google OAuth avatars (user_metadata.avatar_url)
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
