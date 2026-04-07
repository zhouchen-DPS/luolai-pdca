import { validateAllocation } from '@/lib/target-validation'
import { Decimal } from '@prisma/client/runtime/library'

describe('validateAllocation - supervisor → stores', () => {
  const supervisorTarget = new Decimal(100000)

  it('子目标合计 >= 上级目标时通过（允许超发）', () => {
    const storeAmounts = [new Decimal(60000), new Decimal(50000)] // 合计 110000
    expect(validateAllocation(supervisorTarget, storeAmounts, 'supervisor-to-stores')).toBe(true)
  })

  it('子目标合计 < 上级目标时报错（不允许少发）', () => {
    const storeAmounts = [new Decimal(40000), new Decimal(50000)] // 合计 90000
    expect(validateAllocation(supervisorTarget, storeAmounts, 'supervisor-to-stores')).toBe(false)
  })
})

describe('validateAllocation - store → staff', () => {
  const storeTarget = new Decimal(50000)

  it('店员合计 = 门店目标时通过（严格等额）', () => {
    const staffAmounts = [new Decimal(20000), new Decimal(30000)]
    expect(validateAllocation(storeTarget, staffAmounts, 'store-to-staff')).toBe(true)
  })

  it('店员合计 > 门店目标时报错', () => {
    const staffAmounts = [new Decimal(30000), new Decimal(30000)] // 60000 > 50000
    expect(validateAllocation(storeTarget, staffAmounts, 'store-to-staff')).toBe(false)
  })

  it('店员合计 < 门店目标时报错', () => {
    const staffAmounts = [new Decimal(20000), new Decimal(20000)] // 40000 < 50000
    expect(validateAllocation(storeTarget, staffAmounts, 'store-to-staff')).toBe(false)
  })
})
