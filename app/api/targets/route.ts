import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { validateAllocation } from '@/lib/target-validation'
import { notifyTargetAssigned } from '@/lib/feishu-notify'

// GET /api/targets — 获取当前用户可见的目标列表
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const periodStart = searchParams.get('periodStart')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const where: Record<string, unknown> = { isArchived: false }

  if (periodStart) {
    where.periodStart = new Date(periodStart)
  }

  // 督导看自己下辖范围；店员只看自己
  if (user.role === 'SUPERVISOR') {
    const staffIds = await prisma.user
      .findMany({ where: { supervisorId: user.id }, select: { id: true } })
      .then((list) => list.map((u) => u.id))
    where.assigneeId = { in: [user.id, ...staffIds] }
  } else if (user.role === 'STAFF') {
    where.assigneeId = user.id
  }
  // ADMIN / DIRECTOR / REGIONAL_MANAGER 可见全部

  const targets = await prisma.target.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      assigner: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { periodStart: 'desc' },
  })

  return NextResponse.json(targets)
}

// POST /api/targets — 下发目标
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const assigner = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!assigner || !['SUPERVISOR', 'ADMIN', 'DIRECTOR', 'REGIONAL_MANAGER'].includes(assigner.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { assigneeId, storeId, periodStart, periodEnd, amount, childTargets } = body

  if (!assigneeId || !periodStart || !periodEnd || amount == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const amountDecimal = new Decimal(amount)

  // 如有子目标，先做分配校验
  if (childTargets && Array.isArray(childTargets) && childTargets.length > 0) {
    const childAmounts = childTargets.map((c: { amount: string | number }) => new Decimal(c.amount))
    const allocationType = assigner.role === 'SUPERVISOR' ? 'supervisor-to-stores' : 'store-to-staff'
    const valid = validateAllocation(amountDecimal, childAmounts, allocationType)
    if (!valid) {
      return NextResponse.json(
        { error: allocationType === 'supervisor-to-stores' ? '子目标合计不得少于上级目标' : '店员目标合计必须严格等于门店目标' },
        { status: 422 }
      )
    }
  }

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
  if (!assignee) return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })

  const target = await prisma.target.create({
    data: {
      assigneeId,
      storeId: storeId ?? null,
      assignerId: assigner.id,
      periodType: 'MONTHLY',
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      amount: amountDecimal,
    },
  })

  // 飞书通知（不阻塞响应）
  notifyTargetAssigned(assignee, amountDecimal, periodStart).catch(() => null)

  return NextResponse.json(target, { status: 201 })
}
