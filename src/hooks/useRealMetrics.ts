'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TaskMetrics } from '@/types'

interface UseRealMetricsResult {
  metrics: Map<string, TaskMetrics>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook for fetching real work item metrics from the database.
 * Used in view mode when process is active.
 */
export function useRealMetrics(
  workflowId: string,
  enabled: boolean,
  autoRefreshInterval: number = 30000 // 30 seconds default
): UseRealMetricsResult {
  const [metrics, setMetrics] = useState<Map<string, TaskMetrics>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!enabled || !workflowId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/workflows/${workflowId}/metrics`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch metrics')
      }

      const data = await res.json()

      // Convert object to Map
      const metricsMap = new Map<string, TaskMetrics>()
      for (const [taskId, taskMetrics] of Object.entries(data)) {
        metricsMap.set(taskId, taskMetrics as TaskMetrics)
      }

      setMetrics(metricsMap)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [workflowId, enabled])

  // Initial load
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Auto-refresh
  useEffect(() => {
    if (!enabled || autoRefreshInterval <= 0) return

    const interval = setInterval(fetchMetrics, autoRefreshInterval)
    return () => clearInterval(interval)
  }, [enabled, autoRefreshInterval, fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  }
}
