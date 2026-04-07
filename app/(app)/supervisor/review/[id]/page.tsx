'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Review = {
  id: string
  aiContent: string
  editedContent: string | null
  status: string
  weekStart: string
  weekEnd: string
}

export default function ReviewEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [review, setReview] = useState<Review | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetch(`/api/weekly-reviews/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReview(data)
        setContent(data.editedContent ?? data.aiContent)
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/weekly-reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editedContent: content }),
    })
    setSaving(false)
  }

  async function handlePublish() {
    setPublishing(true)
    await handleSave()
    await fetch(`/api/weekly-reviews/${id}/publish`, { method: 'POST' })
    setPublishing(false)
    router.push('/supervisor/review')
  }

  if (!review) return <div className="p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="font-serif text-2xl text-[#6B2D3E] mb-1">编辑周复盘</h2>
      <p className="text-sm text-gray-400 mb-6">{review.weekStart.slice(0, 10)} ~ {review.weekEnd.slice(0, 10)}</p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={16}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#6B2D3E]"
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 border border-[#6B2D3E] text-[#6B2D3E] py-2 rounded-lg text-sm hover:bg-[#F0EBE3] disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存草稿'}
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex-1 bg-[#6B2D3E] text-white py-2 rounded-lg text-sm hover:bg-[#5a2434] disabled:opacity-50 transition-colors"
        >
          {publishing ? '发布中...' : '发布复盘'}
        </button>
      </div>
    </div>
  )
}
