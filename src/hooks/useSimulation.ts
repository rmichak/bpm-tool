'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Task, TaskType, Route, SimulationItem, TaskMetrics } from '@/types';

interface SimulationConfig {
  tasks: Task[];
  routes: Route[];
}

interface SimulationStats {
  totalActive: number;
  totalOverdue: number;
  totalProcessed: number;
}

interface UseSimulationReturn {
  isRunning: boolean;
  speed: number;
  stats: SimulationStats;
  metrics: Map<string, TaskMetrics>;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  injectItem: () => void;
  addRandomItems: (count: number) => void;
  triggerBottleneck: () => void;
  ageAllItems: (hours: number) => void;
}

// Task completion times in simulation seconds
const COMPLETION_TIMES: Partial<Record<TaskType, [number, number]>> = {
  service: [2, 5],
  user: [10, 30],
  begin: [0.5, 1],
  end: [0.5, 1],
  decision: [0.5, 1],
  broadcast: [0.5, 1],
  rendezvous: [1, 3],
  subflow: [5, 15],
};

function generateId(): string {
  return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useSimulation(config: SimulationConfig): UseSimulationReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [items, setItems] = useState<SimulationItem[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemCompletionTimes = useRef<Map<string, number>>(new Map());

  // Find the begin task
  const beginTask = config.tasks.find((t) => t.type === 'begin');

  // Calculate metrics from current items (memoized to prevent infinite re-renders)
  const metrics = useMemo((): Map<string, TaskMetrics> => {
    const metricsMap = new Map<string, TaskMetrics>();
    const now = Date.now();
    const SLA_HOURS = 4; // Items are overdue after 4 hours

    // Initialize metrics for all tasks
    config.tasks.forEach((task) => {
      metricsMap.set(task.id, {
        taskId: task.id,
        activeCount: 0,
        overdueCount: 0,
        avgWaitTime: 0,
        throughputPerDay: Math.floor(Math.random() * 15) + 5, // Mock throughput
        oldestItemAge: 0,
      });
    });

    // Calculate metrics from items
    const taskWaitTimes: Map<string, number[]> = new Map();

    items.forEach((item) => {
      const taskMetrics = metricsMap.get(item.taskId);
      if (!taskMetrics) return;

      taskMetrics.activeCount++;

      const ageHours = (now - item.createdAt) / (1000 * 60 * 60);

      if (item.isOverdue || ageHours > SLA_HOURS) {
        taskMetrics.overdueCount++;
      }

      if (ageHours > taskMetrics.oldestItemAge) {
        taskMetrics.oldestItemAge = ageHours;
      }

      // Track wait times for average calculation
      if (!taskWaitTimes.has(item.taskId)) {
        taskWaitTimes.set(item.taskId, []);
      }
      taskWaitTimes.get(item.taskId)!.push(ageHours);
    });

    // Calculate average wait times
    taskWaitTimes.forEach((times, taskId) => {
      const taskMetrics = metricsMap.get(taskId);
      if (taskMetrics && times.length > 0) {
        taskMetrics.avgWaitTime = times.reduce((a, b) => a + b, 0) / times.length;
      }
    });

    return metricsMap;
  }, [items, config.tasks]);

  // Get stats
  const stats: SimulationStats = {
    totalActive: items.length,
    totalOverdue: items.filter((i) => i.isOverdue).length,
    totalProcessed,
  };

  // Get next task(s) for a given task
  const getNextTasks = useCallback(
    (taskId: string): string[] => {
      const task = config.tasks.find((t) => t.id === taskId);
      if (!task) return [];

      // End task has no next
      if (task.type === 'end') return [];

      // Find outgoing routes
      const outRoutes = config.routes.filter((r) => r.sourceTaskId === taskId);
      return outRoutes.map((r) => r.targetTaskId);
    },
    [config.tasks, config.routes]
  );

  // Process one simulation tick
  const tick = useCallback(() => {
    const now = Date.now();

    setItems((currentItems) => {
      const newItems: SimulationItem[] = [];
      const completedItems: string[] = [];

      currentItems.forEach((item) => {
        const completionTime = itemCompletionTimes.current.get(item.id);

        if (completionTime && now >= completionTime) {
          // Item is complete, move to next task
          const nextTaskIds = getNextTasks(item.taskId);

          if (nextTaskIds.length === 0) {
            // Reached end, remove item
            completedItems.push(item.id);
          } else if (nextTaskIds.length === 1) {
            // Single path, move item
            const task = config.tasks.find((t) => t.id === nextTaskIds[0]);
            const [minTime, maxTime] = COMPLETION_TIMES[task?.type || 'user'] || [5, 15];
            const newCompletionTime = now + (randomBetween(minTime, maxTime) * 1000 / speed);

            itemCompletionTimes.current.set(item.id, newCompletionTime);
            newItems.push({
              ...item,
              taskId: nextTaskIds[0],
              createdAt: now,
              isOverdue: false,
            });
          } else {
            // Multiple paths (broadcast), create items for each
            const task = config.tasks.find((t) => t.id === item.taskId);
            if (task?.type === 'broadcast') {
              nextTaskIds.forEach((nextId) => {
                const newItem: SimulationItem = {
                  id: generateId(),
                  taskId: nextId,
                  createdAt: now,
                  isOverdue: false,
                };
                const nextTask = config.tasks.find((t) => t.id === nextId);
                const [minTime, maxTime] = COMPLETION_TIMES[nextTask?.type || 'user'] || [5, 15];
                const newCompletionTime = now + (randomBetween(minTime, maxTime) * 1000 / speed);
                itemCompletionTimes.current.set(newItem.id, newCompletionTime);
                newItems.push(newItem);
              });
            } else {
              // Decision - pick random path
              const randomNext = nextTaskIds[Math.floor(Math.random() * nextTaskIds.length)];
              const nextTask = config.tasks.find((t) => t.id === randomNext);
              const [minTime, maxTime] = COMPLETION_TIMES[nextTask?.type || 'user'] || [5, 15];
              const newCompletionTime = now + (randomBetween(minTime, maxTime) * 1000 / speed);

              itemCompletionTimes.current.set(item.id, newCompletionTime);
              newItems.push({
                ...item,
                taskId: randomNext,
                createdAt: now,
                isOverdue: false,
              });
            }
          }
        } else {
          // Item still processing
          newItems.push(item);
        }
      });

      if (completedItems.length > 0) {
        setTotalProcessed((p) => p + completedItems.length);
        completedItems.forEach((id) => itemCompletionTimes.current.delete(id));
      }

      return newItems;
    });
  }, [getNextTasks, config.tasks, speed]);

  // Start/stop simulation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 100 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed, tick]);

  const play = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setItems([]);
    setTotalProcessed(0);
    itemCompletionTimes.current.clear();
  }, []);

  const injectItem = useCallback(() => {
    if (!beginTask) return;

    const now = Date.now();
    const newItem: SimulationItem = {
      id: generateId(),
      taskId: beginTask.id,
      createdAt: now,
      isOverdue: false,
    };

    const [minTime, maxTime] = COMPLETION_TIMES.begin || [0.5, 1];
    const completionTime = now + (randomBetween(minTime, maxTime) * 1000 / speed);
    itemCompletionTimes.current.set(newItem.id, completionTime);

    setItems((prev) => [...prev, newItem]);
  }, [beginTask, speed]);

  const addRandomItems = useCallback(
    (count: number) => {
      const now = Date.now();
      const eligibleTasks = config.tasks.filter(
        (t) => t.type !== 'begin' && t.type !== 'end'
      );

      if (eligibleTasks.length === 0) return;

      const newItems: SimulationItem[] = [];
      for (let i = 0; i < count; i++) {
        const task = eligibleTasks[Math.floor(Math.random() * eligibleTasks.length)];
        const newItem: SimulationItem = {
          id: generateId(),
          taskId: task.id,
          createdAt: now - Math.random() * 3600000, // Random age up to 1 hour
          isOverdue: Math.random() < 0.2, // 20% chance of being overdue
        };

        const [minTime, maxTime] = COMPLETION_TIMES[task.type] || [5, 15];
        const completionTime = now + (randomBetween(minTime, maxTime) * 1000 / speed);
        itemCompletionTimes.current.set(newItem.id, completionTime);

        newItems.push(newItem);
      }

      setItems((prev) => [...prev, ...newItems]);
    },
    [config.tasks, speed]
  );

  const triggerBottleneck = useCallback(() => {
    const userTasks = config.tasks.filter((t) => t.type === 'user');
    if (userTasks.length === 0) return;

    const randomTask = userTasks[Math.floor(Math.random() * userTasks.length)];
    const now = Date.now();

    const newItems: SimulationItem[] = [];
    for (let i = 0; i < 10; i++) {
      const newItem: SimulationItem = {
        id: generateId(),
        taskId: randomTask.id,
        createdAt: now - Math.random() * 7200000, // Random age up to 2 hours
        isOverdue: Math.random() < 0.4, // 40% chance of being overdue
      };

      const [minTime, maxTime] = COMPLETION_TIMES.user || [10, 30];
      // Make completion times longer for bottleneck
      const completionTime = now + (randomBetween(minTime * 2, maxTime * 2) * 1000 / speed);
      itemCompletionTimes.current.set(newItem.id, completionTime);

      newItems.push(newItem);
    }

    setItems((prev) => [...prev, ...newItems]);
  }, [config.tasks, speed]);

  const ageAllItems = useCallback((hours: number) => {
    const ageMs = hours * 60 * 60 * 1000;

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        createdAt: item.createdAt - ageMs,
        isOverdue: (Date.now() - (item.createdAt - ageMs)) / (1000 * 60 * 60) > 4,
      }))
    );
  }, []);

  return {
    isRunning,
    speed,
    stats,
    metrics,
    play,
    pause,
    reset,
    setSpeed,
    injectItem,
    addRandomItems,
    triggerBottleneck,
    ageAllItems,
  };
}
