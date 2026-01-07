import prisma from '@/lib/db'
import { inngest } from './client'

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    await step.sleep('fetching-video', '10s')
    await prisma.workflow.create({
      data: {
        name: 'workflow-from-ingest',
      },
    })
    return { message: `Hello ${event.data.email}!` }
  }
)
