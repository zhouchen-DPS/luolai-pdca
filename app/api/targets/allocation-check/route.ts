import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'
import { validateAllocation } from '@/lib/target-validation'

// POST /api/targets/allocation-check — 下发前预校验分配是否合规
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { upperAmount, childAmounts, type } = body

  if (upperAmount == null || !Array.isArray(childAmounts) || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['supervisor-to-stores', 'store-to-staff'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const upper = new Decimal(upperAmount)
  const children = childAmounts.map((a: string | number) => new Decimal(a))
  const total = children.reduce((sum, a) => sum.add(a), new Decimal(0))

  const valid = validateAllocation(upper, children, type)

  return NextResponse.json({
    valid,
    upperAmount: upper.toNumber(),
    totalChildAmount: total.toNumber(),
    diff: total.sub(upper).toNumber(),
  })
}
