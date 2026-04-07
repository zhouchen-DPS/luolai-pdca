import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [target, reports, todayReport] = await Promise.all([
    prisma.target.findFirst({
      where: {
        assigneeId: session!.user.id,
        periodType: 'MONTHLY',
        periodStart: { lte: monthStart },
        periodEnd: { gte: monthEnd },
        isArchived: false,
      },
    }),
    prisma.dailyReport.findMany({
      where: { userId: session!.user.id, reportDate: { gte: monthStart, lte: monthEnd } },
      orderBy: { reportDate: 'desc' },
    }),
    prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId: session!.user.id, reportDate: today } },
    }),
  ])

  const totalSales = reports.reduce((s, r) => s + Number(r.actualAmount), 0)
  const targetAmount = target ? Number(target.amount) : 0
  const completionRate = targetAmount > 0 ? totalSales / targetAmount : 0

  return (
    <div className="p-6 space-y-6">
      <h2 className="font-serif text-2xl text-[#6B2D3E]">我的看板</h2>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#F0EBE3] rounded-lg p-4">
          <p className="text-xs text-gray-500">本月累计销售</p>
          <p className="font-mono text-2xl text-[#6B2D3E] mt-1">¥{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-[#F0EBE3] rounded-lg p-4">
          <p className="text-xs text-gray-500">目标完成率</p>
          <p className={`font-mono text-2xl mt-1 ${completionRate >= 1 ? 'text-green-600' : 'text-red-500'}`}>
            {(completionRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-[#F0EBE3] rounded-lg p-4">
          <p className="text-xs text-gray-500">月度目标</p>
          <p className="font-mono text-2xl text-gray-700 mt-1">¥{targetAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#F0EBE3] rounded-lg p-4">
          <p className="text-xs text-gray-500">今日填报</p>
          <p className={`text-lg font-medium mt-1 ${todayReport ? 'text-green-600' : 'text-orange-500'}`}>
            {todayReport ? '已填报' : '待填报'}
          </p>
        </div>
      </div>

      {/* 最近日报 */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">最近日报</h3>
        <div className="space-y-2">
          {reports.slice(0, 7).map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-gray-600">{r.reportDate.toISOString().slice(0, 10)}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">¥{Number(r.actualAmount).toLocaleString()}</span>
                <span className={`w-2 h-2 rounded-full ${r.isAchieved ? 'bg-green-500' : 'bg-red-400'}`} />
              </div>
            </div>
          ))}
          {reports.length === 0 && <p className="text-gray-400 text-sm">本月暂无日报记录</p>}
        </div>
      </section>
    </div>
  )
}
