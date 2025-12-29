import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockProcesses, mockWorkflows } from '@/lib/mock-data';
import { Plus, GitBranch, Edit, ArrowRight } from 'lucide-react';

export default function BuilderPage() {
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

      <div className="grid gap-4">
        {mockProcesses.map((process) => {
          const workflows = mockWorkflows.filter((w) => w.processId === process.id);

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
                          Version {workflow.version} • {workflow.isMainFlow ? 'Main Flow' : 'Subflow'}
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
    </div>
  );
}
