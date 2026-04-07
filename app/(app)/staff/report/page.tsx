'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!amount || Number(amount) <= 0) {
      setError('请输入有效的销售额')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualAmount: Number(amount),
          failureReason: reason || null,
          successSummary: summary || null,
          reportDate: today,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '提交失败')
        return
      }
      router.push('/staff')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="font-serif text-2xl text-[#6B2D3E] mb-6">填写日报</h2>
      <p className="text-sm text-gray-500 mb-4">{today}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">今日实际销售额（元）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#6B2D3E]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            未达成原因 <span className="text-red-500 text-xs">（未达成时必填，由服务端校验）</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2D3E]"
            placeholder="如未达成，请说明原因..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">成功总结（选填）</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2D3E]"
            placeholder="分享你的销售心得..."
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#6B2D3E] text-white py-3 rounded-lg font-medium hover:bg-[#5a2434] disabled:opacity-50 transition-colors"
        >
          {submitting ? '提交中...' : '提交日报'}
        </button>
      </form>
    </div>
  )
}
