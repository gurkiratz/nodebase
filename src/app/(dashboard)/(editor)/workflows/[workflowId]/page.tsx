import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/features/editor/components/editor";
import { WorkflowsContainer } from "@/features/workflows/components/workflows";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import EditorHeader from "@/features/editor/components/editor-header";

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requireAuth();

  const { workflowId } = await params;
  prefetchWorkflow(workflowId); // just populating the cache

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          <EditorHeader workflowId={workflowId} />
          <main className="flex-1"></main>
          <Editor workflowId={workflowId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};
export default Page;
