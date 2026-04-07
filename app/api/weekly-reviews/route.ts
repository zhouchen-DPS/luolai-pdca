import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/weekly-reviews — 督导查看自己的周复盘列表
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reviews = await prisma.weeklyReview.findMany({
    where: { supervisorId: session.user.id },
    orderBy: { weekStart: 'desc' },
    take: 12, // 最近3个月
  })

  return NextResponse.json(reviews)
}
