import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeklyReview } from '@/lib/claude'
import { notifyWeeklyReviewReady } from '@/lib/feishu-notify'
import { verifyCronSecret } from '@/lib/cron-auth'

// 计算上周周一至周日
function getPrevWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + diff)
  thisMonday.setHours(0, 0, 0, 0)
  const weekEnd = new Date(thisMonday)
  weekEnd.setDate(thisMonday.getDate() - 1)
  weekEnd.setHours(23, 59, 59, 999)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekEnd.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  return { weekStart, weekEnd }
}

// POST /api/cron/weekly-review — 每周一 09:00 CST 触发
// 遍历所有督导，基于上周数据调用 Claude 生成复盘草稿，飞书通知督导查阅
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { weekStart, weekEnd } = getPrevWeekBounds()
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)

  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    select: { id: true, name: true, feishuOpenId: true },
  })

  const results = await Promise.allSettled(
    supervisors.map(async (sv) => {
      const stores = await prisma.store.findMany({
        where: { supervisorId: sv.id },
        select: { id: true, name: true },
      })

      const storeData = await Promise.all(
        stores.map(async (store) => {
          const reports = await prisma.dailyReport.findMany({
            where: { storeId: store.id, reportDate: { gte: weekStart, lte: weekEnd } },
            select: { userId: true, actualAmount: true, failureReason: true },
          })
          const targets = await prisma.target.findMany({
            where: {
              storeId: store.id,
              periodType: 'MONTHLY',
              periodStart: { lte: weekEnd },
              periodEnd: { gte: weekStart },
              isArchived: false,
            },
            select: { amount: true },
          })
          const totalSales = reports.reduce((s, r) => s + Number(r.actualAmount), 0)
          const totalTarget = targets.reduce((s, t) => s + (Number(t.amount) / 30) * 7, 0)
          const completionRate = totalTarget > 0 ? totalSales / totalTarget : 0
          const failureReasons = reports.filter((r) => r.failureReason).map((r) => r.failureReason!)
          return { storeName: store.name, completionRate, sales: totalSales, target: Math.round(totalTarget), topStaff: null, failureReasons }
        })
      )

      const aiContent = await generateWeeklyReview({
        supervisorName: sv.name,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        stores: storeData,
      })

      await prisma.weeklyReview.upsert({
        where: { supervisorId_weekStart: { supervisorId: sv.id, weekStart } },
        create: { supervisorId: sv.id, weekStart, weekEnd, aiContent, status: 'DRAFT' },
        update: { aiContent },
      })

      await notifyWeeklyReviewReady(sv.feishuOpenId, sv.name, weekStartStr, weekEndStr)
    })
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  return NextResponse.json({ total: supervisors.length, failed })
}
