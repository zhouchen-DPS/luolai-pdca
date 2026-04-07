'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'

const NAV: Partial<Record<Role, Array<{ href: string; label: string }>>> = {
  SUPERVISOR: [
    { href: '/supervisor', label: '数据看板' },
    { href: '/supervisor/targets', label: '目标管理' },
    { href: '/supervisor/review', label: '周复盘' },
    { href: '/leaderboard', label: '排行榜' },
  ],
  STAFF: [
    { href: '/staff', label: '我的看板' },
    { href: '/staff/report', label: '填写日报' },
    { href: '/leaderboard', label: '排行榜' },
  ],
  ADMIN: [
    { href: '/admin/experience', label: '经验推送' },
  ],
}

export default function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname()
  const items = NAV[role] ?? []

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-[#F0EBE3]">
      {/* Logo 区 */}
      <div className="px-6 py-8 border-b border-[#DDD3C8]">
        <h1 className="font-serif text-[#6B2D3E] text-lg font-semibold tracking-wide">罗莱 PDCA</h1>
        <p className="text-xs text-[#8B7B72] mt-1">{userName}</p>
      </div>
      {/* 导航 */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded text-sm transition-colors ${
              pathname === item.href
                ? 'bg-[#6B2D3E] text-white font-medium'
                : 'text-[#4A3728] hover:bg-[#E8DDD5]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
