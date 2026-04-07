import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { notifyTargetModified } from '@/lib/feishu-notify'

// PATCH /api/targets/[id] — 调整目标金额
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const modifier = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!modifier || !['SUPERVISOR', 'ADMIN', 'DIRECTOR', 'REGIONAL_MANAGER'].includes(modifier.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const target = await prisma.target.findUnique({
    where: { id: params.id },
    include: { assignee: true },
  })
  if (!target || target.isArchived) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 })
  }

  const body = await req.json()
  if (body.amount == null) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 })
  }

  const oldAmount = target.amount
  const newAmount = new Decimal(body.amount)

  const updated = await prisma.target.update({
    where: { id: params.id },
    data: { amount: newAmount },
  })

  // 飞书通知被调整方
  notifyTargetModified(target.assignee, newAmount, oldAmount).catch(() => null)

  return NextResponse.json(updated)
}
