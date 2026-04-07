import type { NextAuthOptions } from 'next-auth'
import { prisma } from './prisma'
import type { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    {
      id: 'feishu',
      name: '飞书',
      type: 'oauth',
      authorization: {
        url: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
        params: { scope: 'contact:user.base:readonly', response_type: 'code' },
      },
      token: {
        url: 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
        async request({ params, provider }) {
          const res = await fetch('https://open.feishu.cn/open-apis/authen/v1/oidc/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              code: params.code,
              client_id: provider.clientId,
              client_secret: provider.clientSecret,
            }),
          })
          const data = await res.json()
          return { tokens: data.data }
        },
      },
      userinfo: {
        url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
        async request({ tokens }) {
          const res = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          })
          const data = await res.json()
          return data.data
        },
      },
      clientId: process.env.FEISHU_APP_ID!,
      clientSecret: process.env.FEISHU_APP_SECRET!,
      profile(profile) {
        return {
          id: profile.open_id,
          name: profile.name,
          email: profile.enterprise_email ?? `${profile.open_id}@feishu.local`,
          image: profile.avatar_url,
          feishuOpenId: profile.open_id,
          feishuUserId: profile.user_id,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { feishuOpenId: (user as any).feishuOpenId },
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.storeId = dbUser.storeId
          token.supervisorId = dbUser.supervisorId
        } else {
          // 用户未在系统中（尚未通过组织架构同步），标记为未授权
          token.unauthorized = true
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.unauthorized) {
        // 返回空 session 让前端跳转到未授权页面
        return { ...session, unauthorized: true }
      }
      session.user.id = token.userId as string
      session.user.role = token.role as Role
      session.user.storeId = token.storeId as string | null
      session.user.supervisorId = token.supervisorId as string | null
      return session
    },
  },
  pages: { signIn: '/login' },
}
