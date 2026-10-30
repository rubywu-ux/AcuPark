/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Old routes from the first prototype.
    return [
      { source: "/profile", destination: "/settings", permanent: false },
      { source: "/reservation", destination: "/map", permanent: false },
      { source: "/navigation", destination: "/map", permanent: false },
      { source: "/scan-result", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
