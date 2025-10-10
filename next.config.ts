import type { NextConfig } from "next";

const s3Host = process.env.NEXT_PUBLIC_S3_HOSTNAME; // e.g., my-bucket.s3.eu-west-1.amazonaws.com

const nextConfig: NextConfig = {
  images: {
    remotePatterns: s3Host
      ? [
          {
            protocol: 'https',
            hostname: s3Host,
          },
        ]
      : [],
  },
};

export default nextConfig;
