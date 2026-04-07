import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function generateWeeklyReview(context: {
  supervisorName: string
  weekStart: string
  weekEnd: string
  stores: Array<{
    storeName: string
    completionRate: number
    sales: number
    target: number
    topStaff: { name: string; sales: number; completionRate: number } | null
    failureReasons: string[]
  }>
}): Promise<string> {
  const storesSummary = context.stores
    .map(
      (s) =>
        `【${s.storeName}】完成率 ${(s.completionRate * 100).toFixed(1)}%，销售额 ${s.sales.toLocaleString()} 元（目标 ${s.target.toLocaleString()} 元）` +
        (s.topStaff
          ? `，明星店员：${s.topStaff.name}（完成率 ${(s.topStaff.completionRate * 100).toFixed(1)}%）`
          : '') +
        (s.failureReasons.length > 0
          ? `，未达成原因：${s.failureReasons.slice(0, 3).join('；')}`
          : '')
    )
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `你是罗莱生活的销售管理助手。请根据以下数据，为督导【${context.supervisorName}】生成一份结构清晰的周复盘报告。

数据周期：${context.weekStart} 至 ${context.weekEnd}

各门店数据：
${storesSummary}

报告要求：
1. 整体完成情况概述（含整体完成率数字）
2. 亮点门店/店员（具体数字）
3. 需重点关注的门店（低完成率原因分析）
4. 下周行动建议（3条以内，具体可执行）

语气专业简洁，使用中文，控制在400字以内。`,
      },
    ],
  })

  return (message.content[0] as { type: 'text'; text: string }).text
}
