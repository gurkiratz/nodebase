'use client'
import { requireAuth } from '@/lib/auth-utils'
import { caller } from '@/trpc/server'
import { LogoutButton } from './logout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const Page = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data } = useQuery(trpc.getWorkflows.queryOptions())

  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: () => {
        toast.success('AI execution sent')
      },
    })
  )

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
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        Test AI
      </Button>
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
