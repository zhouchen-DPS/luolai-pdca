import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginButton from './LoginButton'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session && !session.unauthorized) redirect('/')

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌图 */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/brand-login.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <p
          className="absolute bottom-12 left-10 right-10 text-white text-sm leading-relaxed"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
        >
          真正的提升不依赖于偶尔的壮举或激进变革，<br />
          而在于系统化、持续地执行像 PDCA 这样的基本管理循环。
        </p>
      </div>

      {/* 右侧登录区 */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#6B2D3E', fontFamily: 'Noto Serif SC, serif' }}
          >
            罗莱 PDCA
          </h1>
          <p className="text-sm mb-10" style={{ color: '#888' }}>销售管理系统</p>
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
