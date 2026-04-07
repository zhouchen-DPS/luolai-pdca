'use client'
import { useEffect, useState } from 'react'

type StaffRank = {
  userId: string
  name: string
  storeName: string
  sales: number
  weekTarget: number
  completionRate: number
}
type Champion = {
  photoUrl: string
  user: { name: string; store: { name: string } }
} | null

export default function LeaderboardPage() {
  const [data, setData] = useState<{ staffRanking: StaffRank[]; champion: Champion } | null>(null)

  useEffect(() => {
    fetch('/api/rankings/weekly').then((r) => r.json()).then(setData)
  }, [])

  if (!data) return <div className="p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-6 space-y-6">
      <h2 className="font-serif text-2xl text-[#6B2D3E]">本周排行榜</h2>

      {/* 冠军风采 */}
      {data.champion && (
        <div className="bg-[#F0EBE3] rounded-xl p-5 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.champion.photoUrl}
            alt="冠军"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#6B2D3E]"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1">本周销售冠军</p>
            <p className="font-serif text-lg text-[#6B2D3E]">{data.champion.user.name}</p>
            <p className="text-sm text-gray-500">{data.champion.user.store.name}</p>
          </div>
        </div>
      )}

      {/* TOP10 */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">店员 TOP10</h3>
        <div className="space-y-2">
          {data.staffRanking.map((r, i) => (
            <div key={r.userId} className="flex items-center gap-3 p-3 border rounded-lg">
              <span className={`w-6 text-center font-mono text-sm font-bold ${i < 3 ? 'text-[#6B2D3E]' : 'text-gray-400'}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-gray-400">{r.storeName}</p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm font-medium ${r.completionRate >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                  {(r.completionRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">¥{r.sales.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {data.staffRanking.length === 0 && <p className="text-gray-400 text-sm">本周暂无排名数据</p>}
        </div>
      </section>
    </div>
  )
}
