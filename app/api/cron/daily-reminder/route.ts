import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyDailyReminder } from '@/lib/feishu-notify'
import { verifyCronSecret } from '@/lib/cron-auth'

// POST /api/cron/daily-reminder — 每天 19:00 CST 触发
// 找到当日未提交日报的店员，逐一发送飞书提醒
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
  const todayDate = new Date(today)

  const allStaff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: { id: true, name: true, feishuOpenId: true },
  })

  const submitted = await prisma.dailyReport.findMany({
    where: { reportDate: todayDate },
    select: { userId: true },
  })
  const submittedIds = new Set(submitted.map((r) => r.userId))

  const pending = allStaff.filter((u) => !submittedIds.has(u.id))

  await Promise.allSettled(
    pending.map((u) => notifyDailyReminder(u.feishuOpenId, u.name))
  )

  if (pending.length > 0) {
    await prisma.notificationLog.createMany({
      data: pending.map((u) => ({
        eventType: 'DAILY_REMINDER',
        recipientId: u.id,
        sentAt: new Date(),
        payload: { date: today },
      })),
    })
  }

  return NextResponse.json({ notified: pending.length })
}
