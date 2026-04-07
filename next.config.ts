import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.oss-cn-hangzhou.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: 'open.feishu.cn',
      },
    ],
  },
}

export default nextConfig
