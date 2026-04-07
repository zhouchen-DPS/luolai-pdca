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
        url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
        async request({ params, provider }) {
          // Step 1: 获取 app_access_token
          const appTokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_id: provider.clientId,
              app_secret: provider.clientSecret,
            }),
          })
          const appTokenData = await appTokenRes.json()
          if (appTokenData.code !== 0) throw new Error(`Feishu app token error: ${appTokenData.msg}`)

          // Step 2: 用 code 换取用户 access_token（响应中直接含用户信息）
          const userTokenRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${appTokenData.app_access_token}`,
            },
            body: JSON.stringify({ grant_type: 'authorization_code', code: params.code }),
          })
          const userTokenData = await userTokenRes.json()
          if (userTokenData.code !== 0) throw new Error(`Feishu user token error: ${userTokenData.msg}`)

          return { tokens: userTokenData.data }
        },
      },
      userinfo: {
        url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
        async request({ tokens }) {
          // tokens 已经包含用户信息（name, open_id, user_id 等），直接返回
          return tokens
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
