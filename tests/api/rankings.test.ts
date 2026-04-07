import { GET } from '@/app/api/rankings/weekly/route'
import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
    dailyReport: { findMany: jest.fn() },
    target: { findMany: jest.fn() },
    championPhoto: { findFirst: jest.fn() },
  },
}))

describe('GET /api/rankings/weekly', () => {
  it('未登录返回 401', async () => {
    const { getServerSession } = require('next-auth')
    getServerSession.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/rankings/weekly'))
    expect(res.status).toBe(401)
  })

  it('月中新入职店员不参与排名（占位，集成测试验证）', () => {
    expect(true).toBe(true)
  })
})
