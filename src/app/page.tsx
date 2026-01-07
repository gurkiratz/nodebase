'use client'
import { requireAuth } from '@/lib/auth-utils'
import { caller } from '@/trpc/server'
import { LogoutButton } from './logout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'

const Page = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data } = useQuery(trpc.getWorkflows.queryOptions())

  const createWorkflow = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      },
    })
  )
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-y-6">
      <p>Protected Server Component</p>
      {JSON.stringify(data, null, 2)}
      <Button
        disabled={createWorkflow.isPending}
        onClick={() => createWorkflow.mutate()}
      >
        Create Workflow
      </Button>
      <LogoutButton />
      {/* protected server component */}
    </div>
  )
}

export default Page
