import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyOverdueSummary } from '@/lib/feishu-notify'
import { verifyCronSecret } from '@/lib/cron-auth'

// POST /api/cron/daily-overdue — 每天 20:05 CST 触发
// 找到逾期未填报的店员，按督导聚合后各发 1 条汇总飞书消息
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
  const todayDate = new Date(today)

  const allStaff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: { id: true, name: true, supervisorId: true },
  })

  const submitted = await prisma.dailyReport.findMany({
    where: { reportDate: todayDate },
    select: { userId: true },
  })
  const submittedIds = new Set(submitted.map((r) => r.userId))

  const overdue = allStaff.filter((u) => !submittedIds.has(u.id))

  // 按督导分组
  const bySupervisor = new Map<string, string[]>()
  for (const u of overdue) {
    if (!u.supervisorId) continue
    if (!bySupervisor.has(u.supervisorId)) bySupervisor.set(u.supervisorId, [])
    bySupervisor.get(u.supervisorId)!.push(u.name)
  }

  if (bySupervisor.size === 0) {
    return NextResponse.json({ overdueCount: 0, supervisorsNotified: 0 })
  }

  const supervisors = await prisma.user.findMany({
    where: { id: { in: Array.from(bySupervisor.keys()) } },
    select: { id: true, feishuOpenId: true },
  })

  await Promise.allSettled(
    supervisors.map((sv) =>
      notifyOverdueSummary(sv.feishuOpenId, bySupervisor.get(sv.id) ?? [])
    )
  )

  await prisma.notificationLog.createMany({
    data: supervisors.map((sv) => ({
      eventType: 'DAILY_OVERDUE_SUMMARY',
      recipientId: sv.id,
      sentAt: new Date(),
      payload: { date: today, count: bySupervisor.get(sv.id)?.length ?? 0 },
    })),
  })

  return NextResponse.json({ overdueCount: overdue.length, supervisorsNotified: supervisors.length })
}
