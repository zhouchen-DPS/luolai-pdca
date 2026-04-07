import { authOptions } from '@/lib/auth'

describe('authOptions', () => {
  it('包含 feishu provider', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('feishu')
  })

  it('session strategy 为 jwt', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })
})
