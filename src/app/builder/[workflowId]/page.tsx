'use client';

import { use } from 'react';
import Link from 'next/link';
import { Canvas } from '@/components/builder/Canvas';
import { getWorkflowDetail, getProcessById } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export default function WorkflowEditorPage({ params }: PageProps) {
  const { workflowId } = use(params);
  const workflow = getWorkflowDetail(workflowId);

  if (!workflow) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Workflow Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The workflow you're looking for doesn't exist.
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

  const process = getProcessById(workflow.processId);

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
              {process?.name} • Version {workflow.version}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <Canvas workflow={workflow} />
    </div>
  );
}
