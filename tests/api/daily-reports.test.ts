import { validateReportSubmission } from '@/lib/report-validation'

describe('validateReportSubmission', () => {
  const baseInput = {
    actualAmount: 8000,
    targetAmount: 10000,
    failureReason: '',
    successSummary: '',
    submittedAt: new Date('2026-04-01T18:00:00+08:00'),
    reportDate: '2026-04-01',
    today: '2026-04-01',
  }

  it('未达成且未填原因 → 拒绝', () => {
    const result = validateReportSubmission({ ...baseInput, failureReason: '' })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/未达成原因/)
  })

  it('未达成且填了原因 → 通过', () => {
    const result = validateReportSubmission({ ...baseInput, failureReason: '客流量少' })
    expect(result.ok).toBe(true)
  })

  it('达成后成功总结为选填 → 通过', () => {
    const result = validateReportSubmission({
      ...baseInput,
      actualAmount: 12000,
      successSummary: '',
    })
    expect(result.ok).toBe(true)
  })

  it('20:00 后提交标记为逾期', () => {
    const late = validateReportSubmission({
      ...baseInput,
      actualAmount: 12000,
      submittedAt: new Date('2026-04-01T20:30:00+08:00'),
    })
    expect(late.isLate).toBe(true)
  })

  it('补填历史日期 → 拒绝', () => {
    const result = validateReportSubmission({
      ...baseInput,
      reportDate: '2026-03-31',
      today: '2026-04-01',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/历史/)
  })
})
