import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_POSTS = 10

// GET /api/experience-posts — 全角色可见，最新10条
export async function GET() {
  const posts = await prisma.experiencePost.findMany({
    orderBy: { createdAt: 'desc' },
    take: MAX_POSTS,
    select: {
      id: true,
      content: true,
      authorName: true,
      storeName: true,
      createdAt: true,
    },
  })
  return NextResponse.json(posts)
}

// POST /api/experience-posts — 仅 ADMIN 推送
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { content, sourceReportId, authorName, storeName } = await req.json()

  if (!content?.trim() || !authorName || !storeName) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // FIFO：超过上限时删除最旧一条
  const count = await prisma.experiencePost.count()
  if (count >= MAX_POSTS) {
    const oldest = await prisma.experiencePost.findFirst({ orderBy: { createdAt: 'asc' } })
    if (oldest) await prisma.experiencePost.delete({ where: { id: oldest.id } })
  }

  const post = await prisma.experiencePost.create({
    data: {
      content,
      sourceReportId: sourceReportId ?? null,
      pushedBy: session.user.id,
      authorName,
      storeName,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
