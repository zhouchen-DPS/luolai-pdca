import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import MobileTabBar from '@/components/layout/MobileTabBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.unauthorized) redirect('/login')

  return (
    <div className="min-h-screen bg-white font-sans">
      <Sidebar role={session.user.role} userName={session.user.name ?? ''} />
      <main className="ml-0 md:ml-[220px] pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <MobileTabBar role={session.user.role} />
    </div>
  )
}
