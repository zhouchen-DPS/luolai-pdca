import { Decimal } from '@prisma/client/runtime/library'

type AllocationType = 'supervisor-to-stores' | 'store-to-staff'

export function validateAllocation(
  upperAmount: Decimal,
  childAmounts: Decimal[],
  type: AllocationType
): boolean {
  const total = childAmounts.reduce((sum, a) => sum.add(a), new Decimal(0))
  if (type === 'supervisor-to-stores') {
    // 可超发，不可少发
    return total.gte(upperAmount)
  }
  // store-to-staff: 严格等额
  return total.equals(upperAmount)
}
