import type { Metadata } from 'next'
import './globals.css'
import Providers from './Providers'

export const metadata: Metadata = {
  title: '罗莱 PDCA 销售管理系统',
  description: '罗莱生活销售目标管理与复盘平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
