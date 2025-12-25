# Nodebase

Nodebase is a visual workflow automation platform that enables users to build automated workflows through a drag-and-drop interface.

## Features

**Visual Workflow Builder**

- Drag-and-drop canvas for creating automated workflows

**Multiple Triggers**

- Webhooks, Google Form submissions, Stripe event listeners, and manual triggers

**AI & Messaging Integrations**

- AI providers: OpenAI, Claude, Gemini
- Messaging platforms: Discord, Slack
- Generic HTTP request node
- Extensible architecture for adding custom integrations

**Real-time Execution & Monitoring**

- Real-time workflow execution with instant status updates via WebSockets
- Visual node status indicators (working, complete, failed)

**Background Job Execution**

- Powered by Inngest for background job execution
- Automatic retry management
- Real-time pub/sub messaging for live updates

**Full SaaS Business Layer**

- Authentication with Better Auth
- Payment and subscription management with Polar
- Support for free tiers, paid plans, and usage-based billing

**Production-Ready Features**

- Sentry integration for error tracking, logging, and session replays
- AI agent monitoring with detailed LLM call information (token counts, costs, execution duration)

## Tech Stack

- **Framework**: Next.js with TypeScript
- **Database**: Prisma ORM with Neon Postgres
- **Workflow Canvas**: React Flow
- **Background Jobs**: Inngest
- **Authentication**: Better Auth
- **Payments**: Polar
- **Monitoring**: Sentry
- **Code Reviews**: Code Rabbit

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
