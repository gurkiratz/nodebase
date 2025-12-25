import { Button } from '@/components/ui/button'
import prisma from '@/lib/db'

const Page = async () => {
  const users = await prisma.user.findMany()
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Hello World</p>
      <pre>{JSON.stringify(users, null, 2)}</pre>
      <Button variant={'outline'}>Click me</Button>
    </div>
  )
}

export default Page
