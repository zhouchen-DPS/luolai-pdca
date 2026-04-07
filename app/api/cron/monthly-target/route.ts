import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyMonthlyTargetDue } from '@/lib/feishu-notify'
import { verifyCronSecret } from '@/lib/cron-auth'

// POST /api/cron/monthly-target — 每月 1 日 09:00 CST 触发
// 检查哪些督导的管辖店员还没分配到当月目标，发送催办通知
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    select: {
      id: true,
      name: true,
      feishuOpenId: true,
      supervisedStores: {
        select: {
          users: { where: { role: 'STAFF' }, select: { id: true } },
        },
      },
    },
  })

  const notified: string[] = []

  for (const sv of supervisors) {
    const allStaffIds = sv.supervisedStores.flatMap((s) => s.users.map((u) => u.id))
    if (allStaffIds.length === 0) continue

    const assignedCount = await prisma.target.count({
      where: {
        assigneeId: { in: allStaffIds },
        periodType: 'MONTHLY',
        periodStart: { lte: monthStart },
        periodEnd: { gte: monthEnd },
        isArchived: false,
      },
    })

    if (assignedCount < allStaffIds.length) {
      await notifyMonthlyTargetDue(sv.feishuOpenId, sv.name)
      notified.push(sv.id)
    }
  }

  return NextResponse.json({ notified: notified.length })
}
