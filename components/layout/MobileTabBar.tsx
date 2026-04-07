'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'

const TABS: Partial<Record<Role, Array<{ href: string; label: string; icon: string }>>> = {
  SUPERVISOR: [
    { href: '/supervisor', label: '看板', icon: '📊' },
    { href: '/supervisor/targets', label: '目标', icon: '🎯' },
    { href: '/supervisor/review', label: '复盘', icon: '📝' },
    { href: '/leaderboard', label: '排行', icon: '🏆' },
  ],
  STAFF: [
    { href: '/staff', label: '看板', icon: '📊' },
    { href: '/staff/report', label: '日报', icon: '✏️' },
    { href: '/leaderboard', label: '排行', icon: '🏆' },
  ],
}

export default function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname()
  const tabs = TABS[role] ?? []

  if (tabs.length === 0) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 flex flex-col items-center py-2 text-xs ${
            pathname === tab.href ? 'text-[#6B2D3E]' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
