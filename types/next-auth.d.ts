import type { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    unauthorized?: boolean
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      storeId: string | null
      supervisorId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: Role
    storeId?: string | null
    supervisorId?: string | null
    unauthorized?: boolean
  }
}
