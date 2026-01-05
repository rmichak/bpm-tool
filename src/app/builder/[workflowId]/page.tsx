'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { workflowApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { WorkflowDetail } from '@/types';

// Dynamic import with ssr: false to prevent hydration mismatch from dnd-kit
const Canvas = dynamic(
  () => import('@/components/builder/Canvas').then((mod) => mod.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

interface WorkflowApiResponse extends WorkflowDetail {
  process?: {
    id: string;
    name: string;
    status: string;
  };
}

export default function WorkflowEditorPage({ params }: PageProps) {
  const { workflowId } = use(params);
  const [workflow, setWorkflow] = useState<WorkflowApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkflow() {
      try {
        setLoading(true);
        setError(null);
        const data = await workflowApi.get(workflowId) as WorkflowApiResponse;
        setWorkflow(data);
      } catch (err) {
        console.error('Failed to fetch workflow:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {error ? 'Error Loading Workflow' : 'Workflow Not Found'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || "The workflow you're looking for doesn't exist."}
          </p>
          <Link href="/builder">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Link href="/builder">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="font-semibold">{workflow.name}</h1>
            <p className="text-xs text-muted-foreground">
              {workflow.process?.name || 'Unknown Process'} • Version {workflow.version}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <Canvas
        workflow={workflow}
        workflowId={workflowId}
        processStatus={workflow.process?.status as 'paused' | 'running' | 'archived' | undefined}
      />
    </div>
  );
}
