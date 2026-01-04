# Phase 3: Inbasket UI Implementation Plan

**Date:** 2026-01-04
**Status:** Draft
**Goal:** Build functional Inbasket UI with My Work/Available Work views, work item detail panel with dynamic route buttons, and mock user context.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Context                              │
│  UserProvider → stores current user in React context             │
│  UserSwitcher → dropdown to switch between seeded users          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Inbasket Page                               │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │    Tab: My Work │    │   Tab: Available Work               │ │
│  │  (claimed items)│    │   (unclaimed queue items)           │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Work Item Detail Page                          │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │   Object Data Panel    │  │   Route Action Buttons          │ │
│  │   (invoice details)    │  │   (dynamic from outbound routes)│ │
│  └────────────────────────┘  └────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   History Timeline                           ││
│  │   (from WorkItemHistory records)                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 App Router
- **UI:** React 18, Tailwind CSS, shadcn/ui
- **State:** React Context for user session
- **Data:** Prisma + SQLite (existing from Phase 2)

## API Client

Create a typed API client at `src/lib/api/work-items.ts`:

```typescript
// Types for API responses (aligned with Prisma relations)
export interface WorkItemListItem {
  id: string
  status: string
  priority: string
  objectType: string
  objectData: Record<string, unknown>
  claimedById: string | null
  claimedAt: string | null
  createdAt: string
  currentTask: {
    id: string
    name: string
    type: string
  }
  workflow: {
    id: string
    name: string
    process: {
      id: string
      name: string
    }
  }
  claimedBy: {
    id: string
    name: string
    email: string
  } | null
}

export interface WorkItemDetail extends WorkItemListItem {
  currentTask: {
    id: string
    name: string
    type: string
    config: Record<string, unknown>
    outboundRoutes: Array<{
      id: string
      label: string | null
      targetTaskId: string
      targetTask: {
        id: string
        name: string
        type: string
      }
    }>
  }
  history: Array<{
    id: string
    taskName: string
    action: string
    routeLabel: string | null
    userId: string | null
    notes: string | null
    timestamp: string
  }>
}
```

---

## Task 1: Create User Context Provider

**Goal:** Provide mock current user throughout the app with ability to switch users.

**File:** `src/contexts/UserContext.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  groups: Array<{ id: string; name: string }>
}

interface UserContextValue {
  currentUser: User | null
  users: User[]
  isLoading: boolean
  switchUser: (userId: string) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
          // Default to first user
          if (data.length > 0) {
            const savedUserId = localStorage.getItem('currentUserId')
            const savedUser = data.find((u: User) => u.id === savedUserId)
            setCurrentUser(savedUser || data[0])
          }
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [])

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setCurrentUser(user)
      localStorage.setItem('currentUserId', userId)
    }
  }

  return (
    <UserContext.Provider value={{ currentUser, users, isLoading, switchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
```

**File:** `src/components/shared/UserSwitcher.tsx`

```typescript
'use client'

import { useUser } from '@/contexts/UserContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronDown, User } from 'lucide-react'

export function UserSwitcher() {
  const { currentUser, users, isLoading, switchUser } = useUser()

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <User className="h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (!currentUser) {
    return null
  }

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{currentUser.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch User (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => switchUser(user.id)}
            className={currentUser.id === user.id ? 'bg-muted' : ''}
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="text-xs">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Update:** `src/app/layout.tsx` - wrap with UserProvider

```typescript
import { UserProvider } from '@/contexts/UserContext'

// In RootLayout, wrap children:
<RoleProvider>
  <UserProvider>
    <TooltipProvider>
      {/* ... */}
    </TooltipProvider>
  </UserProvider>
</RoleProvider>
```

**Update:** `src/components/shared/Header.tsx` - add UserSwitcher to header

**Test:** Run app, verify user switcher appears and persists selection.

**Commit:** `feat: add user context and switcher for mock authentication`

---

## Task 2: Create Work Items API Client

**Goal:** Typed API client for work item operations.

**File:** `src/lib/api/work-items.ts`

```typescript
export interface WorkItemListItem {
  id: string
  status: string
  priority: string
  objectType: string
  objectData: Record<string, unknown>
  claimedById: string | null
  claimedAt: string | null
  createdAt: string
  updatedAt: string
  currentTask: {
    id: string
    name: string
    type: string
    config: Record<string, unknown>
    position: { x: number; y: number }
  }
  workflow: {
    id: string
    name: string
    process: {
      id: string
      name: string
    }
  }
  claimedBy: {
    id: string
    name: string
    email: string
  } | null
}

export interface OutboundRoute {
  id: string
  label: string | null
  targetTaskId: string
  targetTask: {
    id: string
    name: string
    type: string
  }
}

export interface HistoryEntry {
  id: string
  taskId: string
  taskName: string
  action: string
  routeLabel: string | null
  userId: string | null
  notes: string | null
  timestamp: string
}

export interface WorkItemDetail extends WorkItemListItem {
  currentTask: WorkItemListItem['currentTask'] & {
    outboundRoutes: OutboundRoute[]
  }
  history: HistoryEntry[]
}

export const workItemApi = {
  async list(params?: {
    status?: string
    claimedById?: string | null
  }): Promise<WorkItemListItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.claimedById !== undefined) {
      searchParams.set('claimedById', params.claimedById === null ? 'null' : params.claimedById)
    }
    const res = await fetch(`/api/work-items?${searchParams}`)
    if (!res.ok) throw new Error('Failed to fetch work items')
    return res.json()
  },

  async get(id: string): Promise<WorkItemDetail> {
    const res = await fetch(`/api/work-items/${id}`)
    if (!res.ok) throw new Error('Failed to fetch work item')
    return res.json()
  },

  async claim(id: string, userId: string): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to claim work item')
    }
    return res.json()
  },

  async unclaim(id: string): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}/claim`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to unclaim work item')
    }
    return res.json()
  },

  async release(
    id: string,
    routeLabel: string,
    userId: string
  ): Promise<WorkItemDetail> {
    const res = await fetch(`/api/work-items/${id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeLabel, userId }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to release work item')
    }
    return res.json()
  },

  async update(
    id: string,
    data: { objectData?: Record<string, unknown>; priority?: string }
  ): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to update work item')
    }
    return res.json()
  },
}
```

**Commit:** `feat: add typed work items API client`

---

## Task 3: Build Inbasket Page with Tabs

**Goal:** Replace mock data with real API calls, add My Work / Available Work tabs.

**File:** `src/app/inbox/page.tsx` (replace existing)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { workItemApi, WorkItemListItem } from '@/lib/api/work-items'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Inbox,
  RefreshCw,
  Clock,
  Users,
  ArrowRight,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const priorityConfig = {
  low: { border: 'border-l-muted-foreground', badge: 'bg-muted text-muted-foreground', label: 'Low' },
  normal: { border: 'border-l-blue-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Normal' },
  high: { border: 'border-l-warning', badge: 'bg-warning/10 text-warning border-warning/20', label: 'High' },
  urgent: { border: 'border-l-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Urgent' },
}

export default function InbasketPage() {
  const { currentUser, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'my-work' | 'available'>('my-work')
  const [myWork, setMyWork] = useState<WorkItemListItem[]>([])
  const [available, setAvailable] = useState<WorkItemListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!currentUser) return
    try {
      const [myItems, availableItems] = await Promise.all([
        workItemApi.list({ claimedById: currentUser.id }),
        workItemApi.list({ claimedById: null }),
      ])
      setMyWork(myItems.filter((item) => item.status === 'active'))
      setAvailable(availableItems.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('Failed to load work items:', error)
      toast({ title: 'Error', description: 'Failed to load work items', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentUser, toast])

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true)
      loadData()
    }
  }, [currentUser, loadData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  const handleClaim = async (itemId: string) => {
    if (!currentUser) return
    try {
      await workItemApi.claim(itemId, currentUser.id)
      toast({ title: 'Item Claimed', description: 'Work item is now in your queue' })
      loadData()
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Please select a user to view your inbox.</p>
      </div>
    )
  }

  const renderWorkItem = (item: WorkItemListItem, showClaim = false) => {
    const priority = priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.normal
    const objectData = item.objectData as Record<string, unknown>

    return (
      <div
        key={item.id}
        className={cn(
          'group relative rounded-xl border bg-card transition-all duration-200',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          priority.border,
          'border-l-4'
        )}
      >
        <div className="flex items-start gap-4 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Badge variant="outline" className={cn('text-xs capitalize', priority.badge)}>
                {priority.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.currentTask.type}
              </Badge>
            </div>

            <div className="mb-3">
              <h3 className="font-semibold text-base mb-0.5 truncate group-hover:text-primary transition-colors">
                {item.workflow.process.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground/70 font-medium">{item.currentTask.name}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {objectData.invoiceNumber && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono">#{String(objectData.invoiceNumber)}</span>
                </div>
              )}
              {objectData.amount && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-semibold">{Number(objectData.amount).toLocaleString()}</span>
                </div>
              )}
              {item.claimedBy && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{item.claimedBy.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            {showClaim && (
              <Button variant="outline" size="sm" onClick={() => handleClaim(item.id)} className="gap-2">
                <Users className="h-4 w-4" />
                Claim
              </Button>
            )}
            <Link href={`/inbox/${item.id}`}>
              <Button
                variant={showClaim ? 'ghost' : 'outline'}
                size="sm"
                className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderEmptyState = (type: 'my-work' | 'available') => (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">
        {type === 'my-work' ? 'No Work Items' : 'No Available Items'}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {type === 'my-work'
          ? "You don't have any work items claimed. Check the Available tab for items to work on."
          : 'There are no unclaimed items in the queue right now.'}
      </p>
    </div>
  )

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Inbox className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbasket</h1>
            <p className="text-muted-foreground mt-0.5">
              {myWork.length} in your queue, {available.length} available
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myWork.length}</p>
              <p className="text-sm text-muted-foreground">My Work</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{available.length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {[...myWork, ...available].filter((i) => i.priority === 'high' || i.priority === 'urgent').length}
              </p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myWork.length + available.length}</p>
              <p className="text-sm text-muted-foreground">Total Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-work' | 'available')}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-work" className="gap-2">
            <User className="h-4 w-4" />
            My Work
            {myWork.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myWork.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Users className="h-4 w-4" />
            Available
            {available.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {available.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-work">
          <div className="space-y-3">
            {myWork.length === 0 ? renderEmptyState('my-work') : myWork.map((item) => renderWorkItem(item))}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="space-y-3">
            {available.length === 0
              ? renderEmptyState('available')
              : available.map((item) => renderWorkItem(item, true))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Commit:** `feat: build inbasket page with My Work and Available Work tabs`

---

## Task 4: Build Work Item Detail Page

**Goal:** Show object data, current task info, dynamic route buttons, and history timeline.

**File:** `src/app/inbox/[itemId]/page.tsx` (replace existing)

```typescript
'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { workItemApi, WorkItemDetail, OutboundRoute, HistoryEntry } from '@/lib/api/work-items'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Clock,
  User,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Users,
  History,
  FileText,
  ArrowRight,
  Loader2,
  Play,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ itemId: string }>
}

const priorityConfig = {
  low: { border: 'border-l-muted-foreground', badge: 'bg-muted text-muted-foreground', label: 'Low' },
  normal: { border: 'border-l-blue-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Normal' },
  high: { border: 'border-l-warning', badge: 'bg-warning/10 text-warning border-warning/20', label: 'High' },
  urgent: { border: 'border-l-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Urgent' },
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Play className="h-3 w-3" />,
  arrived: <ArrowRight className="h-3 w-3" />,
  claimed: <User className="h-3 w-3" />,
  unclaimed: <Users className="h-3 w-3" />,
  released: <CheckCircle className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
}

export default function WorkItemDetailPage({ params }: PageProps) {
  const { itemId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { currentUser } = useUser()
  const [workItem, setWorkItem] = useState<WorkItemDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReleasing, setIsReleasing] = useState<string | null>(null)

  const loadWorkItem = useCallback(async () => {
    try {
      const data = await workItemApi.get(itemId)
      setWorkItem(data)
    } catch (error) {
      console.error('Failed to load work item:', error)
      toast({ title: 'Error', description: 'Failed to load work item', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [itemId, toast])

  useEffect(() => {
    loadWorkItem()
  }, [loadWorkItem])

  const handleClaim = async () => {
    if (!currentUser || !workItem) return
    try {
      await workItemApi.claim(workItem.id, currentUser.id)
      toast({ title: 'Item Claimed', description: 'Work item is now in your queue' })
      loadWorkItem()
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleUnclaim = async () => {
    if (!workItem) return
    try {
      await workItemApi.unclaim(workItem.id)
      toast({ title: 'Item Released', description: 'Work item returned to queue' })
      loadWorkItem()
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleRelease = async (route: OutboundRoute) => {
    if (!currentUser || !workItem) return
    const routeLabel = route.label || 'default'
    setIsReleasing(route.id)
    try {
      const result = await workItemApi.release(workItem.id, routeLabel, currentUser.id)

      // Check if item is now completed
      if (result.status === 'completed' || result.currentTask.type === 'end') {
        toast({
          title: 'Workflow Completed',
          description: `Work item has been completed`,
        })
        router.push('/inbox')
      } else {
        toast({
          title: 'Item Routed',
          description: `Moved to: ${result.currentTask.name}`,
        })
        loadWorkItem()
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsReleasing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workItem) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Work Item Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The work item you are looking for does not exist or has been removed.
          </p>
          <Link href="/inbox">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Inbox
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const priority = priorityConfig[workItem.priority as keyof typeof priorityConfig] || priorityConfig.normal
  const objectData = workItem.objectData as Record<string, unknown>
  const isClaimedByMe = workItem.claimedById === currentUser?.id
  const isClaimedByOther = workItem.claimedById && !isClaimedByMe
  const outboundRoutes = workItem.currentTask.outboundRoutes || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/inbox">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Inbox
                </Button>
              </Link>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn('capitalize', priority.badge)}>
                  {priority.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    workItem.status === 'active'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {workItem.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!workItem.claimedById && (
                <Button onClick={handleClaim} className="gap-2">
                  <User className="h-4 w-4" />
                  Claim Item
                </Button>
              )}
              {isClaimedByMe && (
                <Button variant="outline" onClick={handleUnclaim} className="gap-2">
                  <Users className="h-4 w-4" />
                  Release to Queue
                </Button>
              )}
              {isClaimedByOther && (
                <Badge variant="outline" className="text-muted-foreground">
                  Claimed by {workItem.claimedBy?.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Object Data */}
          <div className="lg:col-span-3 space-y-6">
            {/* Process Info Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">{workItem.workflow.process.name}</h1>
                  <p className="text-muted-foreground">
                    ID: <code className="font-mono text-sm">{workItem.id}</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Current Step</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-primary" />
                    {workItem.currentTask.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Task Type</p>
                  <p className="font-medium text-sm capitalize">{workItem.currentTask.type}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(workItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Object Type</p>
                  <p className="font-medium text-sm capitalize">{workItem.objectType}</p>
                </div>
              </div>
            </div>

            {/* Object Data Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-4">Object Data</h2>
              <div className="space-y-4">
                {Object.entries(objectData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">
                      {typeof value === 'number' && key.toLowerCase().includes('amount')
                        ? `$${value.toLocaleString()}`
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Actions */}
            {isClaimedByMe && outboundRoutes.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-semibold text-lg mb-4">Route Actions</h2>
                <div className="flex flex-wrap gap-3">
                  {outboundRoutes.map((route) => {
                    const label = route.label || 'Continue'
                    const isEnd = route.targetTask.type === 'end'
                    return (
                      <Button
                        key={route.id}
                        variant={isEnd ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => handleRelease(route)}
                        disabled={isReleasing !== null}
                      >
                        {isReleasing === route.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isEnd ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        {label}
                        {!isEnd && (
                          <span className="text-xs text-muted-foreground">
                            → {route.targetTask.name}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Not claimed prompt */}
            {!workItem.claimedById && (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Claim Required</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  This work item is unclaimed. Claim it to start working on it.
                </p>
                <Button onClick={handleClaim} className="gap-2">
                  <User className="h-4 w-4" />
                  Claim This Item
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">History</h3>
              </div>

              {workItem.history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No history yet</p>
              ) : (
                <div className="space-y-4">
                  {workItem.history.map((entry, index) => (
                    <div key={entry.id} className="relative pl-6">
                      {index < workItem.history.length - 1 && (
                        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                      )}

                      <div
                        className={cn(
                          'absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 bg-card flex items-center justify-center',
                          entry.action === 'completed' || entry.action === 'released'
                            ? 'border-success'
                            : entry.action === 'claimed'
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {actionIcons[entry.action] || <Clock className="h-3 w-3" />}
                      </div>

                      <div className="pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{entry.taskName}</p>
                          {entry.routeLabel && (
                            <Badge variant="outline" className="text-xs">
                              {entry.routeLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-foreground/70 mt-2 p-2 rounded bg-muted/50">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/inbox">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Inbox
                  </Button>
                </Link>
                {isClaimedByMe && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={handleUnclaim}
                  >
                    <XCircle className="h-4 w-4" />
                    Release to Queue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Commit:** `feat: build work item detail page with dynamic route buttons and history`

---

## Task 5: Update Header with User Switcher

**Goal:** Add user switcher to the header component.

**File:** `src/components/shared/Header.tsx` (update)

Add the UserSwitcher component to the header next to the role switcher.

```typescript
// Add import at top
import { UserSwitcher } from '@/components/shared/UserSwitcher'

// In the header JSX, add UserSwitcher in the right side actions area:
<div className="flex items-center gap-2">
  <UserSwitcher />
  {/* ... existing role switcher ... */}
</div>
```

**Commit:** `feat: add user switcher to header`

---

## Task 6: Update Layout with UserProvider

**Goal:** Wrap app with UserProvider for context.

**File:** `src/app/layout.tsx` (update)

```typescript
import { UserProvider } from '@/contexts/UserContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <UserProvider>
            <TooltipProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </TooltipProvider>
          </UserProvider>
        </RoleProvider>
      </body>
    </html>
  )
}
```

**Commit:** `feat: wrap app with UserProvider for session context`

---

## Task 7: Integration Testing

**Goal:** Verify end-to-end functionality.

**Manual Test Plan:**

1. Start the app: `npm run dev`
2. Verify user switcher appears in header
3. Switch between users - verify it persists on refresh
4. Navigate to /inbox
   - Verify "My Work" tab shows items claimed by current user
   - Verify "Available" tab shows unclaimed items
5. Click "Claim" on an available item
   - Verify it moves to My Work tab
   - Verify toast notification appears
6. Click "Open" on a work item
   - Verify detail page loads with object data
   - Verify history timeline shows entries
   - Verify route buttons appear (if claimed by current user)
7. Click a route button (e.g., "Approve")
   - Verify item routes to next task
   - Verify history updates
   - If routed to end task, verify workflow completes
8. Test "Release to Queue" button
   - Verify item returns to available queue

**Commit:** `test: verify inbasket UI integration`

---

## Summary

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | Create User Context Provider | `UserContext.tsx`, `UserSwitcher.tsx` | `feat: add user context and switcher` |
| 2 | Create Work Items API Client | `lib/api/work-items.ts` | `feat: add typed work items API client` |
| 3 | Build Inbasket Page with Tabs | `app/inbox/page.tsx` | `feat: build inbasket page with tabs` |
| 4 | Build Work Item Detail Page | `app/inbox/[itemId]/page.tsx` | `feat: build detail page with routes` |
| 5 | Update Header with User Switcher | `Header.tsx` | `feat: add user switcher to header` |
| 6 | Update Layout with UserProvider | `layout.tsx` | `feat: wrap app with UserProvider` |
| 7 | Integration Testing | - | `test: verify inbasket UI integration` |

## Dependencies

- Phase 2 APIs must be complete (work-items CRUD, claim/unclaim/release)
- Database must be seeded with users and sample work items
