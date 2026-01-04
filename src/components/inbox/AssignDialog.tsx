'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
}

interface AssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupIds: string[]
  onAssign: (userId: string) => void
}

export function AssignDialog({
  open,
  onOpenChange,
  groupIds,
  onAssign,
}: AssignDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && groupIds.length > 0) {
      loadUsers()
    }
  }, [open, groupIds])

  const loadUsers = async () => {
    if (groupIds.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Load users from the first group
      const res = await fetch(`/api/groups/${groupIds[0]}/users`)
      if (!res.ok) {
        throw new Error('Failed to load users')
      }
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load group users:', err)
      setError('Failed to load users from group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    onAssign(userId)
    onOpenChange(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Work Item
          </DialogTitle>
          <DialogDescription>
            Select a team member to assign this work item to
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              No users found in this group
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border border-border p-3',
                    'bg-card hover:bg-accent hover:border-accent transition-colors',
                    'text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
