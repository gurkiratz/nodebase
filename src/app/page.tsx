import { getQueryClient, trpc } from '@/trpc/server'
import { Client } from './client'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

const Page = async () => {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.getUsers.queryOptions())

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Hello World</p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Client />
      </HydrationBoundary>
    </div>
  )
}

export default Page
