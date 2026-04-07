import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateReportSubmission } from '@/lib/report-validation'

// POST /api/daily-reports — 店员提交日报
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { actualAmount, failureReason, successSummary, reportDate } = body

  if (actualAmount == null || !reportDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())

  // 获取本月目标（用于判断是否达成）
  const targetRecord = await prisma.target.findFirst({
    where: {
      assigneeId: session.user.id,
      periodType: 'MONTHLY',
      periodStart: { lte: new Date(reportDate) },
      periodEnd: { gte: new Date(reportDate) },
      isArchived: false,
    },
  })

  // 日参考目标：月目标 / 30（无目标则 0，按达成处理）
  const targetAmount = targetRecord ? Number(targetRecord.amount) / 30 : 0

  const submittedAt = new Date()
  const validation = validateReportSubmission({
    actualAmount: Number(actualAmount),
    targetAmount,
    failureReason: failureReason ?? '',
    successSummary: successSummary ?? '',
    submittedAt,
    reportDate,
    today,
  })

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  // 防止重复提交
  const existing = await prisma.dailyReport.findUnique({
    where: { userId_reportDate: { userId: session.user.id, reportDate: new Date(reportDate) } },
  })
  if (existing) {
    return NextResponse.json({ error: '今日日报已提交' }, { status: 409 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.storeId) {
    return NextResponse.json({ error: '当前账号未绑定门店' }, { status: 422 })
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId: session.user.id,
      storeId: user.storeId,
      reportDate: new Date(reportDate),
      actualAmount,
      isAchieved: validation.isAchieved,
      failureReason: failureReason || null,
      successSummary: successSummary || null,
      isLate: validation.isLate,
      submittedAt,
    },
  })

  return NextResponse.json(report, { status: 201 })
}

// GET /api/daily-reports — 查询日报列表
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  let where: Record<string, unknown> = {}

  if (session.user.role === 'STAFF') {
    where = { userId: session.user.id }
  } else if (session.user.role === 'SUPERVISOR') {
    const staffIds = await prisma.user
      .findMany({ where: { supervisorId: session.user.id }, select: { id: true } })
      .then((u) => u.map((x) => x.id))
    where = { userId: { in: staffIds } }
  }

  if (startDate) where.reportDate = { ...(where.reportDate as object), gte: new Date(startDate) }
  if (endDate) where.reportDate = { ...(where.reportDate as object), lte: new Date(endDate) }

  const reports = await prisma.dailyReport.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      store: { select: { name: true } },
    },
    orderBy: { reportDate: 'desc' },
  })

  return NextResponse.json(reports)
}
