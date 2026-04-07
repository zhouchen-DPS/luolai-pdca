import { getTenantToken } from './feishu'
import type { User } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

async function sendFeishuMessage(openId: string, text: string): Promise<void> {
  const token = await getTenantToken()
  await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
}

export async function notifyTargetAssigned(
  assignee: User,
  amount: Decimal,
  periodStart: string
): Promise<void> {
  const text = `📊 您的本月销售目标已下发：${amount} 元（${periodStart}）`
  await sendFeishuMessage(assignee.feishuOpenId, text)
}

export async function notifyTargetModified(
  assignee: User,
  newAmount: Decimal,
  oldAmount: Decimal
): Promise<void> {
  const text = `📊 您的销售目标已调整：${oldAmount} 元 → ${newAmount} 元`
  await sendFeishuMessage(assignee.feishuOpenId, text)
}

export async function notifyDailyReminder(openId: string, name: string): Promise<void> {
  const text = `⏰ ${name}，今日日报还未填写，请在 20:00 前完成填报。`
  await sendFeishuMessage(openId, text)
}

export async function notifyOverdueSummary(
  supervisorOpenId: string,
  overdueNames: string[]
): Promise<void> {
  const text = `⚠️ 今日日报逾期未填（${overdueNames.length} 人）：${overdueNames.join('、')}`
  await sendFeishuMessage(supervisorOpenId, text)
}

export async function notifyMonthlyTargetDue(openId: string, name: string): Promise<void> {
  const text = `📅 ${name}，本月目标尚未下发，请在今日内完成目标拆分。`
  await sendFeishuMessage(openId, text)
}
