import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.unauthorized) {
    redirect('/login')
  }

  const role = session.user.role
  if (role === 'SUPERVISOR') redirect('/supervisor')
  if (role === 'STAFF') redirect('/staff')
  if (role === 'ADMIN') redirect('/admin/experience')
  redirect('/login')
}
