import { Decimal } from '@prisma/client/runtime/library'

export function calcAchievementRate(actual: Decimal, target: Decimal): number {
  if (target.isZero()) return 0
  return actual.div(target).toNumber()
}

export function getRedGreenStatus(rate: number): 'green' | 'red' {
  return rate >= 1.0 ? 'green' : 'red'
}

export function calcMonthlyProgress(
  cumulativeActual: Decimal,
  monthlyTarget: Decimal
): { rate: number; status: 'green' | 'red' } {
  const rate = calcAchievementRate(cumulativeActual, monthlyTarget)
  return { rate, status: getRedGreenStatus(rate) }
}

/** 计算当月应完成参考进度（今天是本月第几天 / 本月总天数） */
export function calcExpectedProgress(today: Date): number {
  const year = today.getFullYear()
  const month = today.getMonth()
  const dayOfMonth = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return dayOfMonth / daysInMonth
}
