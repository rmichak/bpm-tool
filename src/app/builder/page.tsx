'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { processApi } from '@/lib/api';
import { Plus, GitBranch, Edit, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface WorkflowSummary {
  id: string;
  name: string;
  isSubflow: boolean;
}

interface ProcessWithWorkflows {
  id: string;
  name: string;
  description: string | null;
  status: string;
  workflows: WorkflowSummary[];
  createdAt: string;
  updatedAt: string;
}

export default function BuilderPage() {
  const [processes, setProcesses] = useState<ProcessWithWorkflows[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processApi
      .list()
      .then((data) => setProcesses(data as ProcessWithWorkflows[]))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load processes</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Design and manage your business process workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Process
        </Button>
      </div>

      {processes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No processes yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first process</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Process
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {processes.map((process) => {
            const workflows = process.workflows || [];

            return (
              <Card key={process.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{process.name}</CardTitle>
                        <CardDescription>{process.description}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        process.status === 'active'
                          ? 'success'
                          : process.status === 'draft'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {process.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
                    </p>
                    {workflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{workflow.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {workflow.isSubflow ? 'Subflow' : 'Main Flow'}
                          </p>
                        </div>
                        <Link href={`/builder/${workflow.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {workflows.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No workflows yet</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Create Workflow
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
