'use client'
import { useEffect, useState } from 'react'

type Target = {
  id: string
  amount: string
  periodStart: string
  periodEnd: string
  assignee: { id: string; name: string; role: string }
  store: { name: string } | null
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const thisMonth = new Date()
    const periodStart = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`
    fetch(`/api/targets?periodStart=${periodStart}`)
      .then((r) => r.json())
      .then((data) => { setTargets(data); setLoading(false) })
  }, [])

  if (loading) return <div className="p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-6 space-y-4">
      <h2 className="font-serif text-2xl text-[#6B2D3E]">目标管理</h2>

      <div className="space-y-2">
        {targets.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{t.assignee.name}</p>
              <p className="text-xs text-gray-400">{t.store?.name ?? '—'} · {t.periodStart.slice(0, 10)}</p>
            </div>
            <span className="font-mono text-[#6B2D3E] font-medium">
              ¥{Number(t.amount).toLocaleString()}
            </span>
          </div>
        ))}
        {targets.length === 0 && <p className="text-gray-400 text-sm">本月暂无目标记录</p>}
      </div>
    </div>
  )
}
