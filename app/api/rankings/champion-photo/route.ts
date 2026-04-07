import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToOSS } from '@/lib/oss'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('photo') as File
  const userId = formData.get('userId') as string
  const weekStartStr = formData.get('weekStart') as string

  if (!file || !userId || !weekStartStr) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  const photoUrl = await uploadToOSS(file, `champion/${weekStartStr}/${userId}`)
  const weekStart = new Date(weekStartStr)

  const photo = await prisma.championPhoto.create({
    data: { userId, weekStart, photoUrl, uploadedBy: session.user.id },
  })

  // 同步更新店员档案照
  await prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl: photoUrl },
  })

  return NextResponse.json(photo, { status: 201 })
}
