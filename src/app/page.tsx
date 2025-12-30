import { requireAuth } from '@/lib/auth-utils'
import { caller } from '@/trpc/server'
import { LogoutButton } from './logout'

const Page = async () => {
  await requireAuth()

  const data = await caller.getUsers()

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Protected Server Component</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <LogoutButton />
      {/* protected server component */}
    </div>
  )
}

export default Page
