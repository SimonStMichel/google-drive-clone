import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // The build is the gate: type errors should fail it, not be published.
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      // Uploads travel to the server as Server Action arguments, so the action
      // body limit has to clear MAX_FILE_SIZE (50MB) plus multipart overhead.
      bodySizeLimit: "100MB",
    },
    // Every request matched by proxy.ts is also capped here, and this one
    // defaults to 10MB - low enough that a 14MB upload had its body truncated
    // before the action ever ran, surfacing as busboy's "Unexpected end of
    // form". Raising bodySizeLimit alone is not enough; both have to clear it.
    proxyClientMaxBodySize: "100MB",
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
