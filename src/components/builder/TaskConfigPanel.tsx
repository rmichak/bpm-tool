'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import {
  X,
  Settings,
  Users,
  FileText,
  GitBranch,
  Clock,
  Save,
  Trash2,
  Play,
  Square,
  User as UserIcon,
  Split,
  Merge,
  Cog,
  Layers,
} from 'lucide-react';
import { mockGroups } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface TaskConfigPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const taskIcons = {
  begin: Play,
  end: Square,
  user: UserIcon,
  decision: GitBranch,
  broadcast: Split,
  rendezvous: Merge,
  service: Cog,
  subflow: Layers,
};

// Mock form fields for the form tab
const mockFormFields = [
  { id: 'customer_name', label: 'Customer Name', type: 'text', required: true },
  { id: 'request_type', label: 'Request Type', type: 'select', required: true },
  { id: 'priority', label: 'Priority', type: 'select', required: false },
  { id: 'description', label: 'Description', type: 'textarea', required: false },
  { id: 'amount', label: 'Amount', type: 'number', required: false },
  { id: 'due_date', label: 'Due Date', type: 'date', required: false },
  { id: 'attachments', label: 'Attachments', type: 'file', required: false },
  { id: 'approval_notes', label: 'Approval Notes', type: 'textarea', required: false },
];

export function TaskConfigPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskConfigPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [taskName, setTaskName] = useState(task?.name || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');
  const [assignmentType, setAssignmentType] = useState<'user' | 'group'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [enabledFields, setEnabledFields] = useState<Set<string>>(
    new Set(['customer_name', 'request_type', 'description'])
  );
  const [slaEnabled, setSlaEnabled] = useState(false);
  const [slaHours, setSlaHours] = useState(24);
  const [routeLabels, setRouteLabels] = useState(['Approve', 'Reject']);

  if (!task) return null;

  const Icon = taskIcons[task.type];
  const isTerminal = task.type === 'begin' || task.type === 'end';
  const isDecision = task.type === 'decision';

  const toggleField = (fieldId: string) => {
    const newEnabled = new Set(enabledFields);
    if (newEnabled.has(fieldId)) {
      newEnabled.delete(fieldId);
    } else {
      newEnabled.add(fieldId);
    }
    setEnabledFields(newEnabled);
  };

  const handleSave = () => {
    toast({
      title: 'Task Updated',
      description: `"${taskName}" has been updated. (Mockup)`,
      variant: 'success',
    });
  };

  const handleDelete = () => {
    onDelete?.(task.id);
    onClose();
    toast({
      title: 'Task Deleted',
      description: `"${task.name}" has been removed. (Mockup)`,
      variant: 'destructive',
    });
  };

  return (
    <div className="w-[400px] h-full border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Configure Task</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {task.type} Task
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-transparent">
          <TabsTrigger
            value="general"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          {!isTerminal && (
            <>
              <TabsTrigger
                value="assignment"
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Users className="h-4 w-4" />
                Assignment
              </TabsTrigger>
              <TabsTrigger
                value="form"
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <FileText className="h-4 w-4" />
                Form
              </TabsTrigger>
            </>
          )}
          {isDecision && (
            <TabsTrigger
              value="routing"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <GitBranch className="h-4 w-4" />
              Routing
            </TabsTrigger>
          )}
          {!isTerminal && (
            <TabsTrigger
              value="sla"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Clock className="h-4 w-4" />
              SLA
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          {/* General Tab */}
          <TabsContent value="general" className="m-0 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Add a description for this task..."
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Task ID</span>
                <code className="font-mono text-xs bg-background px-2 py-1 rounded">
                  {task.id}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize">
                  {task.type}
                </Badge>
              </div>
            </div>
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="m-0 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment Type</label>
              <div className="flex gap-2">
                <Button
                  variant={assignmentType === 'group' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAssignmentType('group')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Group Queue
                </Button>
                <Button
                  variant={assignmentType === 'user' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAssignmentType('user')}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Specific User
                </Button>
              </div>
            </div>

            {assignmentType === 'group' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a group...</option>
                  {mockGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Work items will be added to the selected group queue for any
                  member to claim.
                </p>
              </div>
            )}

            {assignmentType === 'user' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select a user...</option>
                  <option value="john">John Smith</option>
                  <option value="sarah">Sarah Connor</option>
                  <option value="mike">Mike Wilson</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Work items will be assigned directly to the selected user.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form" className="m-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which fields should be visible and editable in this task:
            </p>
            <div className="space-y-2">
              {mockFormFields.map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    enabledFields.has(field.id)
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={enabledFields.has(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {field.type}
                        {field.required && ' • Required'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Routing Tab */}
          <TabsContent value="routing" className="m-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Define the labels for each outgoing route from this decision
              point:
            </p>
            <div className="space-y-3">
              {routeLabels.map((label, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">
                    Route {index + 1}
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      const newLabels = [...routeLabels];
                      newLabels[index] = e.target.value;
                      setRouteLabels(newLabels);
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setRouteLabels([...routeLabels, ''])}
              >
                Add Route
              </Button>
            </div>
          </TabsContent>

          {/* SLA Tab */}
          <TabsContent value="sla" className="m-0 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">Enable SLA</p>
                <p className="text-xs text-muted-foreground">
                  Set a deadline for this task
                </p>
              </div>
              <Switch checked={slaEnabled} onCheckedChange={setSlaEnabled} />
            </div>

            {slaEnabled && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Limit</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={slaHours}
                      onChange={(e) => setSlaHours(Number(e.target.value))}
                      className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      min={1}
                    />
                    <select className="w-24 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Hours</option>
                      <option>Days</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">On SLA Breach</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Notify supervisor</option>
                    <option>Escalate to queue</option>
                    <option>Auto-approve</option>
                    <option>Auto-reject</option>
                  </select>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
