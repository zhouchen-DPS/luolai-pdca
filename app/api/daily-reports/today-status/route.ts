import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/daily-reports/today-status — 查询当前用户今日是否已填报
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())

  const report = await prisma.dailyReport.findUnique({
    where: {
      userId_reportDate: {
        userId: session.user.id,
        reportDate: new Date(today),
      },
    },
    select: { id: true, isAchieved: true, isLate: true, actualAmount: true, submittedAt: true },
  })

  return NextResponse.json({ submitted: !!report, report: report ?? null })
}
