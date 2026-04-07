import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenantToken, fetchDeptMembers, fetchSubDepts, mapFeishuJobToRole } from '@/lib/feishu'

export async function POST(req: NextRequest) {
  // 允许通过 CRON_SECRET 绕过登录（用于首次初始化 / 定时任务）
  const cronSecret = req.headers.get('x-cron-secret')
  const isSystemCall = cronSecret === process.env.CRON_SECRET

  if (!isSystemCall) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const token = await getTenantToken()

  // 先同步根部门成员（department_id = '0' 代表根组织）
  const rootMembers = await fetchDeptMembers(token, '0')
  const depts = await fetchSubDepts(token)

  // 收集所有部门的成员
  const allMembersByDept: Array<{ deptName: string; members: Awaited<ReturnType<typeof fetchDeptMembers>> }> = [
    { deptName: 'root', members: rootMembers },
  ]

  for (const dept of depts) {
    const members = await fetchDeptMembers(token, dept.department_id)
    allMembersByDept.push({ deptName: dept.name, members })
  }

  let syncedCount = 0
  const seen = new Set<string>()

  for (const { members } of allMembersByDept) {
    for (const member of members) {
      if (seen.has(member.open_id)) continue
      seen.add(member.open_id)

      const role = mapFeishuJobToRole(member.job_title ?? '')
      await prisma.user.upsert({
        where: { feishuOpenId: member.open_id },
        update: {
          name: member.name,
          role,
          avatarUrl: member.avatar_url,
        },
        create: {
          feishuOpenId: member.open_id,
          feishuUserId: member.user_id,
          name: member.name,
          role,
          avatarUrl: member.avatar_url,
          joinedAt: member.join_time ? new Date(member.join_time * 1000) : new Date(),
        },
      })
      syncedCount++
    }
  }

  return NextResponse.json({ ok: true, synced: syncedCount, depts: depts.length })
}
