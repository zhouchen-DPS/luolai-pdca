import { mapFeishuJobToRole } from '@/lib/feishu'

describe('mapFeishuJobToRole', () => {
  it('营销总监 → DIRECTOR', () => {
    expect(mapFeishuJobToRole('营销总监')).toBe('DIRECTOR')
  })
  it('片区经理 → REGIONAL_MANAGER', () => {
    expect(mapFeishuJobToRole('片区经理')).toBe('REGIONAL_MANAGER')
  })
  it('督导 → SUPERVISOR', () => {
    expect(mapFeishuJobToRole('督导')).toBe('SUPERVISOR')
  })
  it('店员/销售 → STAFF', () => {
    expect(mapFeishuJobToRole('店员')).toBe('STAFF')
    expect(mapFeishuJobToRole('销售顾问')).toBe('STAFF')
  })
  it('管理员 → ADMIN', () => {
    expect(mapFeishuJobToRole('系统管理员')).toBe('ADMIN')
  })
  it('未知职位 → STAFF (默认)', () => {
    expect(mapFeishuJobToRole('未知职位')).toBe('STAFF')
  })
})
