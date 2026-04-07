import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getWeekBounds(now: Date): { weekStart: Date; weekEnd: Date } {
  const day = now.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // 调整到周一
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart, weekEnd } = getWeekBounds(new Date())
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1)

  // 月中新入职：joinedAt >= 本月 2 日，不参与当月排名
  const cutoff = new Date(monthStart)
  cutoff.setDate(2)

  // 获取有效店员（排除月中新入职）
  const staffList = await prisma.user.findMany({
    where: { role: 'STAFF', joinedAt: { lt: cutoff } },
    select: { id: true, name: true, storeId: true, store: { select: { name: true } } },
  })
  const staffIds = staffList.map((u) => u.id)

  // 本周日报汇总
  const reports = await prisma.dailyReport.findMany({
    where: { userId: { in: staffIds }, reportDate: { gte: weekStart, lte: weekEnd } },
    select: { userId: true, actualAmount: true },
  })

  // 本月目标
  const targets = await prisma.target.findMany({
    where: {
      assigneeId: { in: staffIds },
      periodType: 'MONTHLY',
      periodStart: { lte: weekEnd },
      periodEnd: { gte: weekStart },
      isArchived: false,
    },
    select: { assigneeId: true, amount: true },
  })

  const targetMap = new Map(targets.map((t) => [t.assigneeId, Number(t.amount)]))

  // 按店员聚合本周销售额
  const salesMap = new Map<string, number>()
  for (const r of reports) {
    salesMap.set(r.userId, (salesMap.get(r.userId) ?? 0) + Number(r.actualAmount))
  }

  const staffRanking = staffList
    .map((u) => {
      const sales = salesMap.get(u.id) ?? 0
      const monthTarget = targetMap.get(u.id) ?? 0
      const weekTarget = monthTarget > 0 ? (monthTarget / 30) * 7 : 0
      const completionRate = weekTarget > 0 ? sales / weekTarget : 0
      return {
        userId: u.id,
        name: u.name,
        storeName: (u.store as { name: string } | null)?.name ?? '',
        sales,
        weekTarget: Math.round(weekTarget),
        completionRate,
      }
    })
    .sort((a, b) =>
      b.completionRate !== a.completionRate
        ? b.completionRate - a.completionRate
        : b.sales - a.sales
    )
    .slice(0, 10)

  // 当周冠军风采照
  const champion = await prisma.championPhoto.findFirst({
    where: { weekStart },
    include: { user: { select: { name: true, store: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ staffRanking, champion, weekStart, weekEnd })
}
