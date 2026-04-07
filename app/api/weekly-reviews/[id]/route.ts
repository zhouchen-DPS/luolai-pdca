import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/weekly-reviews/[id] — 查看单份复盘
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const review = await prisma.weeklyReview.findUnique({ where: { id: params.id } })
  if (!review) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  // 督导只能看自己的；店员只能看已发布的
  if (
    (session.user.role === 'SUPERVISOR' && review.supervisorId !== session.user.id) ||
    (session.user.role === 'STAFF' && review.status !== 'PUBLISHED')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(review)
}

// PATCH /api/weekly-reviews/[id] — 督导编辑复盘内容
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const review = await prisma.weeklyReview.findUnique({ where: { id: params.id } })
  if (!review || review.supervisorId !== session.user.id) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { editedContent } = await req.json()
  if (!editedContent?.trim()) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
  }

  const updated = await prisma.weeklyReview.update({
    where: { id: params.id },
    data: { editedContent },
  })

  return NextResponse.json(updated)
}
