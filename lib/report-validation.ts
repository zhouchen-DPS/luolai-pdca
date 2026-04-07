interface ReportInput {
  actualAmount: number
  targetAmount: number
  failureReason: string
  successSummary: string
  submittedAt: Date
  reportDate: string // YYYY-MM-DD
  today: string // YYYY-MM-DD
}

interface ValidationResult {
  ok: boolean
  error?: string
  isAchieved: boolean
  isLate: boolean
}

export function validateReportSubmission(input: ReportInput): ValidationResult {
  const isAchieved = input.actualAmount >= input.targetAmount

  // 禁止补填历史日期
  if (input.reportDate < input.today) {
    return { ok: false, error: '不允许补填历史日期', isAchieved, isLate: false }
  }

  // 未达成时原因必填
  if (!isAchieved && !input.failureReason.trim()) {
    return { ok: false, error: '未达成原因为必填项', isAchieved, isLate: false }
  }

  // 判断是否逾期（20:00 CST），使用 Asia/Shanghai 时区避免服务器时区差异
  const shanghaiHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: 'numeric',
      hour12: false,
    }).format(input.submittedAt),
    10
  )
  const isLate = shanghaiHour >= 20

  return { ok: true, isAchieved, isLate }
}
