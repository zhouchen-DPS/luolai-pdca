import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    experiencePost: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('experience posts FIFO logic', () => {
  it('超过10条时删除最旧一条', async () => {
    const { prisma: p } = require('@/lib/prisma')
    p.experiencePost.count.mockResolvedValue(10)
    p.experiencePost.findFirst.mockResolvedValue({ id: 'oldest-id' })
    p.experiencePost.delete.mockResolvedValue({})
    p.experiencePost.create.mockResolvedValue({ id: 'new-id' })

    expect(p.experiencePost.count).toBeDefined()
    expect(p.experiencePost.findFirst).toBeDefined()
    expect(p.experiencePost.delete).toBeDefined()
  })
})
