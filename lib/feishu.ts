import type { Role } from '@prisma/client'

const FEISHU_BASE = 'https://open.feishu.cn/open-apis'

/** 获取飞书 tenant_access_token */
export async function getTenantToken(): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Feishu token error: ${data.msg}`)
  return data.tenant_access_token
}

/** 职位名称 → 系统角色映射 */
export function mapFeishuJobToRole(jobTitle: string): Role {
  if (jobTitle.includes('总监')) return 'DIRECTOR'
  if (jobTitle.includes('片区经理') || jobTitle.includes('区域经理')) return 'REGIONAL_MANAGER'
  if (jobTitle.includes('督导')) return 'SUPERVISOR'
  if (jobTitle.includes('管理员')) return 'ADMIN'
  return 'STAFF'
}

export interface FeishuDeptMember {
  open_id: string
  user_id: string
  name: string
  avatar_url: string
  job_title: string
  enterprise_email?: string
  join_time: number
  department_ids: string[]
}

/** 拉取部门下所有成员（自动分页） */
export async function fetchDeptMembers(
  token: string,
  deptId: string
): Promise<FeishuDeptMember[]> {
  const members: FeishuDeptMember[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      department_id: deptId,
      page_size: '50',
      ...(pageToken ? { page_token: pageToken } : {}),
    })
    const res = await fetch(`${FEISHU_BASE}/contact/v3/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.code !== 0) throw new Error(`Feishu users error: ${data.msg}`)
    members.push(...(data.data?.items ?? []))
    pageToken = data.data?.has_more ? data.data.page_token : undefined
  } while (pageToken)

  return members
}

/** 拉取所有子部门 */
export async function fetchSubDepts(
  token: string,
  parentDeptId: string = '0'
): Promise<Array<{ department_id: string; name: string; parent_department_id: string }>> {
  const res = await fetch(
    `${FEISHU_BASE}/contact/v3/departments/children?department_id=${parentDeptId}&fetch_child=true&page_size=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Feishu depts error: ${data.msg}`)
  return data.data?.items ?? []
}
