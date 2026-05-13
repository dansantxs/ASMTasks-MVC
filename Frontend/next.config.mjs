/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: 'http://backend:8080/api/:path*',
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
