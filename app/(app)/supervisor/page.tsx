import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SupervisorDashboard() {
  const session = await getServerSession(authOptions)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const stores = await prisma.store.findMany({
    where: { supervisorId: session!.user.id },
    include: {
      users: { where: { role: 'STAFF' }, select: { id: true, name: true } },
    },
  })
  const storeIds = stores.map((s) => s.id)

  const [reports, targets, todayReports] = await Promise.all([
    prisma.dailyReport.findMany({
      where: { storeId: { in: storeIds }, reportDate: { gte: monthStart, lte: monthEnd } },
      select: { storeId: true, actualAmount: true },
    }),
    prisma.target.findMany({
      where: { storeId: { in: storeIds }, periodType: 'MONTHLY', periodStart: { lte: monthEnd }, periodEnd: { gte: monthStart }, isArchived: false },
      select: { storeId: true, amount: true },
    }),
    prisma.dailyReport.findMany({
      where: { storeId: { in: storeIds }, reportDate: today },
      select: { userId: true },
    }),
  ])

  const todaySubmittedIds = new Set(todayReports.map((r) => r.userId))
  const allStaff = stores.flatMap((s) => s.users)
  const unreportedToday = allStaff.filter((u) => !todaySubmittedIds.has(u.id))

  const storeSummary = stores.map((store) => {
    const sales = reports.filter((r) => r.storeId === store.id).reduce((s, r) => s + Number(r.actualAmount), 0)
    const target = targets.filter((t) => t.storeId === store.id).reduce((s, t) => s + Number(t.amount), 0)
    const completionRate = target > 0 ? sales / target : 0
    return { ...store, sales, target, completionRate, isRed: completionRate < 1 }
  })

  const redStores = storeSummary.filter((s) => s.isRed)

  return (
    <div className="p-6 space-y-6">
      <h2 className="font-serif text-2xl text-[#6B2D3E]">督导看板</h2>

      {redStores.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-3">预警门店（{redStores.length}）</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {redStores.map((s) => (
              <div key={s.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-red-600 font-mono text-sm">{(s.completionRate * 100).toFixed(1)}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ¥{s.sales.toLocaleString()} / ¥{s.target.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {unreportedToday.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-3">今日未填报（{unreportedToday.length}）</h3>
          <div className="flex flex-wrap gap-2">
            {unreportedToday.map((u) => (
              <span key={u.id} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{u.name}</span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">全部门店</h3>
        <div className="space-y-2">
          {storeSummary.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">{s.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.isRed ? 'bg-red-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(s.completionRate * 100, 100)}%` }}
                  />
                </div>
                <span className={`font-mono text-sm ${s.isRed ? 'text-red-600' : 'text-green-600'}`}>
                  {(s.completionRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          {storeSummary.length === 0 && <p className="text-gray-400 text-sm">暂无管辖门店</p>}
        </div>
      </section>
    </div>
  )
}
