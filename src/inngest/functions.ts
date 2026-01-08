import prisma from '@/lib/db'
import { inngest } from './client'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const google = createGoogleGenerativeAI()
const openai = createOpenAI()
const anthropic = createAnthropic()

export const execute = inngest.createFunction(
  { id: 'execute' },
  { event: 'execute/ai' },
  async ({ event, step }) => {
    await step.sleep('pretend', '5s')
    const { steps: geminiSteps } = await step.ai.wrap(
      'gemini-generate-text',
      generateText,
      {
        model: google('gemini-2.5-flash'),
        system: 'You are a helpful assistant.',
        prompt: 'Who are you?',
      }
    )

    const { steps: openaiSteps } = await step.ai.wrap(
      'openai-generate-text',
      generateText,
      {
        model: openai('gpt-4o'),
        system: 'You are a helpful assistant.',
        prompt: 'Who are you?',
      }
    )

    const { steps: anthropicSteps } = await step.ai.wrap(
      'anthropic-generate-text',
      generateText,
      {
        model: anthropic('claude-3.5-sonnet'),
        system: 'You are a helpful assistant.',
        prompt: 'Who are you?',
      }
    )

    return {
      geminiSteps,
      openaiSteps,
      anthropicSteps,
    }
  }
)
