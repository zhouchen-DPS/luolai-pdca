import { calcAchievementRate, getRedGreenStatus, calcMonthlyProgress } from '@/lib/status'
import { Decimal } from '@prisma/client/runtime/library'

describe('calcAchievementRate', () => {
  it('完成率 = 实际 / 目标', () => {
    expect(calcAchievementRate(new Decimal(8000), new Decimal(10000))).toBe(0.8)
  })
  it('超额完成返回 > 1', () => {
    expect(calcAchievementRate(new Decimal(11000), new Decimal(10000))).toBe(1.1)
  })
  it('目标为 0 时返回 0 而非 NaN', () => {
    expect(calcAchievementRate(new Decimal(1000), new Decimal(0))).toBe(0)
  })
})

describe('getRedGreenStatus', () => {
  it('完成率 >= 100% 为绿', () => {
    expect(getRedGreenStatus(1.0)).toBe('green')
    expect(getRedGreenStatus(1.05)).toBe('green')
  })
  it('完成率 = 99.9% 为红', () => {
    expect(getRedGreenStatus(0.999)).toBe('red')
  })
  it('完成率 = 0 为红', () => {
    expect(getRedGreenStatus(0)).toBe('red')
  })
})

describe('calcMonthlyProgress', () => {
  it('当月累计实际 / 月目标', () => {
    const result = calcMonthlyProgress(new Decimal(25000), new Decimal(100000))
    expect(result.rate).toBeCloseTo(0.25)
    expect(result.status).toBe('red')
  })
  it('月目标为 0 时不崩溃', () => {
    const result = calcMonthlyProgress(new Decimal(0), new Decimal(0))
    expect(result.rate).toBe(0)
  })
})
