'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TaskNode from './nodes/TaskNode';
import AnimatedEdge from './edges/AnimatedEdge';
import { TaskPalette } from './TaskPalette';
import { TaskConfigPanel } from './TaskConfigPanel';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { ProcessTree, ProcessTreeNode } from './ProcessTree';
import { SimulationPanel } from './SimulationPanel';
import { useSimulation } from '@/hooks/useSimulation';
import { useRealMetrics } from '@/hooks/useRealMetrics';
import { taskApi, routeApi } from '@/lib/api';
import type { Task, Route, TaskType, WorkflowDetail, TaskMetrics, ComparisonOperator } from '@/types';
import { RouteConditionEditor, type RouteCondition, formatConditionsBadge } from './RouteConditionEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Undo,
  Redo,
  Play,
  CheckCircle,
  AlertTriangle,
  Grid3X3,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Gamepad2,
  Palette,
  FolderTree,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  label: string;
  onSelect?: (taskId: string) => void;
  onDrillDown?: (taskId: string) => void;
  subflowInfo?: {
    taskCount: number;
    decisionCount: number;
    nestedSubflows: number;
  };
  metrics?: TaskMetrics;
}

interface CanvasProps {
  workflow: WorkflowDetail;
  workflowId: string;
  processStatus?: 'paused' | 'running' | 'archived';
  onSave?: (tasks: Task[], routes: Route[]) => void;
}

const nodeTypes: NodeTypes = {
  begin: TaskNode,
  end: TaskNode,
  user: TaskNode,
  decision: TaskNode,
  broadcast: TaskNode,
  rendezvous: TaskNode,
  service: TaskNode,
  subflow: TaskNode,
} as NodeTypes;

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
} as EdgeTypes;

function tasksToNodes(
  tasks: Task[],
  onSelect?: (taskId: string) => void,
  onDrillDown?: (taskId: string) => void,
  metricsMap?: Map<string, TaskMetrics>
): Node<TaskNodeData>[] {
  return tasks.map((task) => {
    const metrics = metricsMap?.get(task.id);

    // Mock subflow info for subflow tasks
    const subflowInfo = task.type === 'subflow' ? {
      taskCount: 5,
      decisionCount: 2,
      nestedSubflows: 0,
    } : undefined;

    return {
      id: task.id,
      type: task.type,
      position: task.position,
      data: {
        task,
        label: task.name,
        onSelect,
        onDrillDown,
        subflowInfo,
        metrics,
      },
    };
  });
}

function routesToEdges(routes: Route[]): Edge[] {
  return routes.map((route) => {
    // Parse conditions from route
    const condition = (route as any).condition;
    let conditions: RouteCondition[] = [];
    if (condition) {
      if (Array.isArray(condition)) {
        conditions = condition;
      } else if (condition.conditions && Array.isArray(condition.conditions)) {
        conditions = condition.conditions;
      }
    }

    // Build label: route label + condition badge
    const conditionBadge = formatConditionsBadge(conditions);
    let label = route.label || '';
    if (conditionBadge) {
      label = label ? `${label} [${conditionBadge}]` : `[${conditionBadge}]`;
    }

    return {
      id: route.id,
      source: route.sourceTaskId,
      target: route.targetTaskId,
      label: label || undefined,
      type: 'animated',
      animated: false,
      style: { strokeWidth: 2 },
      labelStyle: { fontSize: 12, fontWeight: 500 },
      labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.95 },
    };
  });
}

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 relative transition-colors ${
        isOver ? 'bg-primary/5' : ''
      }`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

type SidebarView = 'palette' | 'tree';

export function Canvas({ workflow, workflowId, processStatus, onSave }: CanvasProps) {
  const { toast } = useToast();
  const [sidebarView, setSidebarView] = useState<SidebarView>('palette');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showSimulation, setShowSimulation] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([
    { id: workflow.id, name: workflow.name, workflowId: workflow.id },
  ]);

  // Determine if we're in view mode (process is active)
  const isViewMode = processStatus === 'running';

  // Track pending position updates to debounce API calls
  const pendingPositionUpdates = useRef<Map<string, { x: number; y: number }>>(new Map());
  const positionUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Build process tree from workflow data
  const processTree: ProcessTreeNode = useMemo(() => {
    // Build task nodes for this workflow
    const taskNodes: ProcessTreeNode[] = workflow.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      type: 'task' as const,
      taskType: task.type,
      workflowId: workflow.id,
      children: task.type === 'subflow' && task.config && 'subflowId' in task.config
        ? [
            {
              id: `${task.id}-subflow`,
              name: 'Subflow content',
              type: 'workflow' as const,
              workflowId: (task.config as any).subflowId,
              isMainFlow: false,
              children: [],
            },
          ]
        : undefined,
    }));

    return {
      id: workflow.id,
      name: workflow.name,
      type: 'workflow' as const,
      workflowId: workflow.id,
      isMainFlow: workflow.isMainFlow,
      children: taskNodes,
    };
  }, [workflow]);

  // Initialize simulation (for edit mode)
  const simulation = useSimulation({
    tasks: workflow.tasks,
    routes: workflow.routes,
  });

  // Initialize real metrics (for view mode)
  const realMetrics = useRealMetrics(workflowId, isViewMode, refreshInterval);

  // Use real metrics in view mode, simulation metrics in edit mode
  const activeMetrics = isViewMode ? realMetrics.metrics : simulation.metrics;

  const handleNodeSelect = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleDrillDown = useCallback((taskId: string) => {
    const task = workflow.tasks.find((t) => t.id === taskId);
    if (task && task.type === 'subflow' && task.config && 'subflowId' in task.config) {
      // In a real implementation, this would load the subflow
      toast({
        title: 'Drill Down',
        description: `Would navigate into subflow: ${task.name}. (Mockup)`,
      });
      // Add to breadcrumb path
      setBreadcrumbPath((prev) => [
        ...prev,
        { id: taskId, name: task.name, workflowId: (task.config as any).subflowId },
      ]);
    }
  }, [workflow.tasks, toast]);

  const handleBreadcrumbNavigate = useCallback((workflowId: string) => {
    // Navigate back to a previous level
    const index = breadcrumbPath.findIndex((b) => b.workflowId === workflowId);
    if (index >= 0) {
      setBreadcrumbPath((prev) => prev.slice(0, index + 1));
      toast({
        title: 'Navigation',
        description: `Navigated to: ${breadcrumbPath[index].name}. (Mockup)`,
      });
    }
  }, [breadcrumbPath, toast]);

  // Handle edge click to open route editor
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedRouteId(edge.id);
    setShowRouteEditor(true);
  }, []);

  // Get selected route data
  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    return workflow.routes.find((r) => r.id === selectedRouteId) || null;
  }, [selectedRouteId, workflow.routes]);

  // Parse conditions from route
  const getRouteConditions = useCallback((route: Route | null): RouteCondition[] => {
    if (!route) return [];
    // Route condition is stored as JSON object with conditions array
    const condition = (route as any).condition;
    if (!condition) return [];
    if (Array.isArray(condition)) return condition;
    if (condition.conditions && Array.isArray(condition.conditions)) return condition.conditions;
    return [];
  }, []);

  // Save route conditions
  const handleSaveRouteConditions = useCallback(async (
    routeId: string,
    label: string,
    conditions: RouteCondition[]
  ) => {
    try {
      await routeApi.update(workflowId, routeId, {
        label: label || undefined,
        condition: conditions.length > 0 ? { conditions } : undefined,
      });
      toast({
        title: 'Route Updated',
        description: 'Route conditions saved successfully',
      });
      // Trigger a refresh - in a real app, you'd update local state
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save route conditions',
        variant: 'destructive',
      });
    }
  }, [workflowId, toast]);

  const initialNodes = useMemo(
    () => tasksToNodes(workflow.tasks, handleNodeSelect, handleDrillDown, activeMetrics),
    [workflow.tasks, handleNodeSelect, handleDrillDown, activeMetrics]
  );
  const initialEdges = useMemo(
    () => routesToEdges(workflow.routes),
    [workflow.routes]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Flush pending position updates to API
  const flushPositionUpdates = useCallback(() => {
    if (pendingPositionUpdates.current.size === 0) return;

    const updates = Array.from(pendingPositionUpdates.current.entries());
    pendingPositionUpdates.current.clear();

    updates.forEach(([taskId, position]) => {
      taskApi.update(workflowId, taskId, { position }).catch((err) => {
        console.error('Failed to update task position:', err);
      });
    });
  }, [workflowId]);

  // Custom onNodesChange that persists position changes
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<TaskNodeData>>[]) => {
      // In view mode, only allow selection changes
      if (isViewMode) {
        const selectionChanges = changes.filter((c) => c.type === 'select');
        if (selectionChanges.length > 0) {
          setNodes((nds) => applyNodeChanges(selectionChanges, nds));
        }
        return;
      }

      // Apply changes locally first
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Handle position changes (debounced)
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Queue the position update
          pendingPositionUpdates.current.set(change.id, change.position);

          // Clear existing timeout and set a new one
          if (positionUpdateTimeout.current) {
            clearTimeout(positionUpdateTimeout.current);
          }
          positionUpdateTimeout.current = setTimeout(flushPositionUpdates, 300);
        }

        // Handle node deletion
        if (change.type === 'remove') {
          taskApi.delete(workflowId, change.id).catch((err) => {
            console.error('Failed to delete task:', err);
            toast({
              title: 'Error',
              description: 'Failed to delete task',
              variant: 'destructive',
            });
          });
        }
      });
    },
    [workflowId, setNodes, flushPositionUpdates, toast, isViewMode]
  );

  // Custom onEdgesChange that persists edge deletions
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      // In view mode, ignore all edge changes
      if (isViewMode) return;

      // Apply changes locally first
      setEdges((eds) => applyEdgeChanges(changes, eds));

      // Handle edge deletion
      changes.forEach((change) => {
        if (change.type === 'remove') {
          routeApi.delete(workflowId, change.id).catch((err) => {
            console.error('Failed to delete route:', err);
            toast({
              title: 'Error',
              description: 'Failed to delete connection',
              variant: 'destructive',
            });
          });
        }
      });
    },
    [workflowId, setEdges, toast, isViewMode]
  );

  // Update node metrics when metrics change (either simulation or real)
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const metrics = activeMetrics.get(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            metrics: metrics || node.data.metrics,
          },
        };
      })
    );
  }, [activeMetrics, setNodes]);

  // Get selected task
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    const node = nodes.find((n) => n.id === selectedTaskId);
    return node?.data.task || null;
  }, [selectedTaskId, nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      // In view mode, don't allow connections
      if (isViewMode) return;

      if (!params.source || !params.target) return;

      // Generate a temporary ID for optimistic update
      const tempId = `route-${Date.now()}`;

      // Add edge locally first (optimistic update)
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: tempId,
            type: 'animated',
            style: { strokeWidth: 2 },
          },
          eds
        )
      );

      // Persist to API
      routeApi
        .create(workflowId, {
          sourceTaskId: params.source,
          targetTaskId: params.target,
        })
        .then((result) => {
          const createdRoute = result as { id: string };
          // Update the edge with the real ID from the server
          setEdges((eds) =>
            eds.map((e) => (e.id === tempId ? { ...e, id: createdRoute.id } : e))
          );
        })
        .catch((err) => {
          console.error('Failed to create route:', err);
          // Remove the optimistically added edge on failure
          setEdges((eds) => eds.filter((e) => e.id !== tempId));
          toast({
            title: 'Error',
            description: 'Failed to create connection',
            variant: 'destructive',
          });
        });
    },
    [workflowId, setEdges, toast, isViewMode]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // In view mode, don't allow adding tasks
      if (isViewMode) return;

      const { active, over } = event;

      if (!over || over.id !== 'canvas-drop-zone') return;
      if (!active.data.current?.fromPalette) return;

      const taskType = active.data.current.type as TaskType;
      const taskName = `New ${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`;
      const position = { x: 400, y: 200 + nodes.length * 100 };

      // Generate a temporary ID for optimistic update
      const tempId = `task-${Date.now()}`;

      const newTask: Task = {
        id: tempId,
        workflowId: workflowId,
        type: taskType,
        name: taskName,
        description: '',
        config: { type: taskType } as Task['config'],
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newNode: Node<TaskNodeData> = {
        id: newTask.id,
        type: newTask.type,
        position: newTask.position,
        data: { task: newTask, label: newTask.name, onSelect: handleNodeSelect },
      };

      // Add node locally first (optimistic update)
      setNodes((nds) => [...nds, newNode]);
      setSelectedTaskId(newTask.id);

      // Persist to API
      taskApi
        .create(workflowId, {
          type: taskType,
          name: taskName,
          position,
          config: { type: taskType },
        })
        .then((result) => {
          const createdTask = result as Task;
          // Update the node with the real ID and data from the server
          setNodes((nds) =>
            nds.map((n) =>
              n.id === tempId
                ? {
                    ...n,
                    id: createdTask.id,
                    data: {
                      ...n.data,
                      task: createdTask,
                    },
                  }
                : n
            )
          );
          // Update selected task ID if it was the temp one
          setSelectedTaskId((prev) => (prev === tempId ? createdTask.id : prev));
          toast({
            title: 'Task Added',
            description: `${taskName} has been added to the canvas.`,
          });
        })
        .catch((err) => {
          console.error('Failed to create task:', err);
          // Remove the optimistically added node on failure
          setNodes((nds) => nds.filter((n) => n.id !== tempId));
          setSelectedTaskId(null);
          toast({
            title: 'Error',
            description: 'Failed to create task',
            variant: 'destructive',
          });
        });
    },
    [workflowId, nodes.length, setNodes, handleNodeSelect, toast, isViewMode]
  );

  const handleSave = useCallback(() => {
    const tasks: Task[] = nodes.map((node) => ({
      ...node.data.task,
      position: node.position,
    }));

    const routes: Route[] = edges.map((edge) => ({
      id: edge.id,
      workflowId: workflow.id,
      sourceTaskId: edge.source,
      targetTaskId: edge.target,
      label: (edge.label as string) || '',
      createdAt: new Date().toISOString(),
    }));

    onSave?.(tasks, routes);
    toast({
      title: 'Workflow Saved',
      description: 'Your changes have been saved successfully. (Mockup)',
      variant: 'success',
    });
  }, [nodes, edges, workflow.id, onSave, toast]);

  const handleValidate = useCallback(() => {
    // Simple validation mockup
    const hasBegin = nodes.some((n) => n.type === 'begin');
    const hasEnd = nodes.some((n) => n.type === 'end');

    if (!hasBegin || !hasEnd) {
      toast({
        title: 'Validation Failed',
        description: 'Workflow must have at least one Begin and one End task.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Validation Passed',
      description: 'Workflow structure is valid.',
      variant: 'success',
    });
  }, [nodes, toast]);

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      // Get the edges to delete for cleanup
      const edgesToDelete = edges.filter(
        (e) => e.source === taskId || e.target === taskId
      );

      // Remove node and edges locally first
      setNodes((nds) => nds.filter((n) => n.id !== taskId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== taskId && e.target !== taskId)
      );
      setSelectedTaskId(null);

      // Persist task deletion to API
      taskApi.delete(workflowId, taskId).catch((err) => {
        console.error('Failed to delete task:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete task',
          variant: 'destructive',
        });
      });

      // Persist edge deletions to API
      edgesToDelete.forEach((edge) => {
        routeApi.delete(workflowId, edge.id).catch((err) => {
          console.error('Failed to delete route:', err);
        });
      });
    },
    [workflowId, edges, setNodes, setEdges, toast]
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar with view toggle */}
        <div className="flex flex-col">
          {/* View toggle tabs (only when not collapsed and not in view mode) */}
          {!sidebarCollapsed && !isViewMode && (
            <div className="flex border-b border-border bg-card/50">
              <button
                onClick={() => setSidebarView('palette')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  sidebarView === 'palette'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Palette className="h-4 w-4" />
                Palette
              </button>
              <button
                onClick={() => setSidebarView('tree')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  sidebarView === 'tree'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <FolderTree className="h-4 w-4" />
                Tree
              </button>
            </div>
          )}

          {/* Sidebar content - in view mode only show tree */}
          {isViewMode ? (
            <ProcessTree
              tree={processTree}
              currentWorkflowId={breadcrumbPath[breadcrumbPath.length - 1]?.workflowId || workflow.id}
              currentTaskId={selectedTaskId || undefined}
              onNavigate={handleBreadcrumbNavigate}
              onSelectTask={handleNodeSelect}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          ) : sidebarView === 'palette' ? (
            <TaskPalette
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          ) : (
            <ProcessTree
              tree={processTree}
              currentWorkflowId={breadcrumbPath[breadcrumbPath.length - 1]?.workflowId || workflow.id}
              currentTaskId={selectedTaskId || undefined}
              onNavigate={handleBreadcrumbNavigate}
              onSelectTask={handleNodeSelect}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {/* Breadcrumbs (shown when navigated into subflows) */}
          {breadcrumbPath.length > 1 && (
            <Breadcrumbs
              path={breadcrumbPath}
              onNavigate={handleBreadcrumbNavigate}
            />
          )}

          {/* Enhanced Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Workflow name */}
              <div className="flex items-center gap-2">
                {isViewMode ? (
                  <span className="font-semibold text-lg">{workflow.name}</span>
                ) : (
                  <input
                    type="text"
                    defaultValue={workflow.name}
                    className="font-semibold text-lg bg-transparent border-none focus:outline-none focus:ring-0 w-auto"
                    style={{ width: `${workflow.name.length + 2}ch` }}
                  />
                )}
                <Badge variant="outline" className="text-xs">
                  v{workflow.version}
                </Badge>
                {isViewMode ? (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View Mode
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className={
                      workflow.status === 'published'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                    }
                  >
                    {workflow.status}
                  </Badge>
                )}
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Stats */}
              <span className="text-sm text-muted-foreground">
                {nodes.length} tasks · {edges.length} connections
              </span>

              {/* Real metrics loading/error indicator */}
              {isViewMode && (
                <>
                  <div className="w-px h-6 bg-border" />
                  {realMetrics.loading ? (
                    <span className="text-sm text-muted-foreground">Loading metrics...</span>
                  ) : realMetrics.error ? (
                    <span className="text-sm text-destructive">Error: {realMetrics.error}</span>
                  ) : (
                    <span className="text-sm text-success">Live metrics</span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View controls */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant={showGrid ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle grid"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                {!isViewMode && (
                  <Button
                    variant={showSimulation ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSimulation(!showSimulation)}
                    title="Toggle simulation panel"
                  >
                    <Gamepad2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="w-px h-6 bg-border" />

              {isViewMode ? (
                /* View mode actions */
                <div className="flex items-center gap-2">
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="h-8 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    title="Auto-refresh interval"
                  >
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>1m</option>
                    <option value={0}>Off</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => realMetrics.refresh()}
                    disabled={realMetrics.loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${realMetrics.loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              ) : (
                /* Edit mode actions */
                <>
                  {/* History */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <Redo className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-border" />

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleValidate}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Validate
                  </Button>

                  <Button size="sm" className="gap-2" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 bg-success hover:bg-success/90"
                  >
                    <Play className="h-4 w-4" />
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Canvas */}
          <CanvasDropZone>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{
                type: 'animated',
              }}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              className="bg-background"
              deleteKeyCode={isViewMode ? null : ['Backspace', 'Delete']}
              nodesDraggable={!isViewMode}
              nodesConnectable={!isViewMode}
              elementsSelectable={true}
              onNodeClick={(_, node) => setSelectedTaskId(node.id)}
              onEdgeClick={handleEdgeClick}
              onPaneClick={() => {
                setSelectedTaskId(null);
                setSelectedRouteId(null);
              }}
            >
              {showGrid && (
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  className="opacity-30"
                />
              )}
              <Controls
                className="!bg-card !border-border !rounded-lg !shadow-lg"
                showZoom
                showFitView
                showInteractive={false}
              />
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="!bg-card !border-border !rounded-lg"
                maskColor="hsl(var(--background) / 0.8)"
              />
            </ReactFlow>
          </CanvasDropZone>
        </div>

        {/* Config Panel - in view mode, hide delete option */}
        {selectedTask && (
          <TaskConfigPanel
            task={selectedTask}
            workflowId={workflowId}
            onClose={() => setSelectedTaskId(null)}
            onDelete={isViewMode ? undefined : handleDeleteTask}
          />
        )}
      </div>

      {/* Simulation Panel - only show in edit mode */}
      {!isViewMode && showSimulation && (
        <SimulationPanel
          isRunning={simulation.isRunning}
          speed={simulation.speed}
          totalActive={simulation.stats.totalActive}
          totalOverdue={simulation.stats.totalOverdue}
          totalProcessed={simulation.stats.totalProcessed}
          onPlay={simulation.play}
          onPause={simulation.pause}
          onReset={simulation.reset}
          onSpeedChange={simulation.setSpeed}
          onInjectItem={simulation.injectItem}
          onAddRandomItems={simulation.addRandomItems}
          onTriggerBottleneck={simulation.triggerBottleneck}
          onAgeAllItems={simulation.ageAllItems}
        />
      )}

      {/* Route Condition Editor */}
      <RouteConditionEditor
        open={showRouteEditor}
        onOpenChange={setShowRouteEditor}
        routeId={selectedRouteId || ''}
        routeLabel={selectedRoute?.label || null}
        conditions={getRouteConditions(selectedRoute)}
        onSave={handleSaveRouteConditions}
        readOnly={isViewMode}
      />
    </DndContext>
  );
}
