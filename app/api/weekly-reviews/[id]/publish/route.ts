import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyWeeklyReviewPublished } from '@/lib/feishu-notify'

// POST /api/weekly-reviews/[id]/publish — 发布周复盘并通知店员
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const review = await prisma.weeklyReview.findUnique({ where: { id: params.id } })
  if (!review || review.supervisorId !== session.user.id) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const updated = await prisma.weeklyReview.update({
    where: { id: params.id },
    data: { status: 'PUBLISHED', lastPublishedAt: new Date() },
  })

  // 飞书通知管辖店员（不阻塞响应）
  const weekStart = review.weekStart.toISOString().slice(0, 10)
  const weekEnd = review.weekEnd.toISOString().slice(0, 10)

  prisma.user
    .findMany({
      where: { role: 'STAFF', supervisorId: session.user.id },
      select: { feishuOpenId: true, name: true },
    })
    .then((staff) =>
      Promise.allSettled(
        staff.map((s) =>
          notifyWeeklyReviewPublished(s.feishuOpenId, s.name, weekStart, weekEnd)
        )
      )
    )
    .catch(() => null)

  return NextResponse.json(updated)
}
