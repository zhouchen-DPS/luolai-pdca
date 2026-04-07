'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Review = {
  id: string
  weekStart: string
  weekEnd: string
  status: 'DRAFT' | 'PUBLISHED'
  lastPublishedAt: string | null
}

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    fetch('/api/weekly-reviews').then((r) => r.json()).then(setReviews)
  }, [])

  return (
    <div className="p-6">
      <h2 className="font-serif text-2xl text-[#6B2D3E] mb-6">周复盘</h2>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Link
            key={r.id}
            href={`/supervisor/review/${r.id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium">{r.weekStart.slice(0, 10)} ~ {r.weekEnd.slice(0, 10)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.status === 'PUBLISHED' ? `已发布 ${r.lastPublishedAt?.slice(0, 10)}` : '草稿'}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              r.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {r.status === 'PUBLISHED' ? '已发布' : '草稿'}
            </span>
          </Link>
        ))}
        {reviews.length === 0 && <p className="text-gray-400 text-sm">暂无复盘记录</p>}
      </div>
    </div>
  )
}
