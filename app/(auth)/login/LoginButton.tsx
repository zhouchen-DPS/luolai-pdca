'use client'
import { signIn } from 'next-auth/react'

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn('feishu', { callbackUrl: '/' })}
      className="w-full py-3 px-6 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
      style={{ backgroundColor: '#6B2D3E' }}
    >
      飞书账号登录
    </button>
  )
}
