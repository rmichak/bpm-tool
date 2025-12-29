'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { extendedUsers, mockGroups, groupMemberships } from '@/lib/mock-data'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  UserX,
  Users,
  Shield,
  User,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function UsersPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getGroupsForUser = (userId: string) => {
    const userGroups = groupMemberships
      .filter((gm) => gm.userIds.includes(userId))
      .map((gm) => mockGroups.find((g) => g.id === gm.groupId)?.name)
      .filter(Boolean)
    return userGroups
  }

  const getMemberCount = (groupId: string) => {
    const membership = groupMemberships.find((gm) => gm.groupId === groupId)
    return membership?.userIds.length || 0
  }

  const filteredUsers = extendedUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAction = (action: string, name: string) => {
    toast({
      title: `${action}`,
      description: `Action performed on "${name}". (Mockup)`,
    })
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Groups</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and group memberships
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setInviteOpen(false)
                  toast({
                    title: 'Invitation Sent',
                    description: 'User will receive an email invitation. (Mockup)',
                  })
                }}
              >
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            Groups
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => {
                  const groups = getGroupsForUser(user.id)
                  return (
                    <TableRow
                      key={user.id}
                      className="stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            user.role === 'admin'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : ''
                          )}
                        >
                          {user.role === 'admin' && (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            user.status === 'active'
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {groups.length > 0 ? (
                            groups.map((group, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {group}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No groups
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastActiveAt
                          ? new Date(user.lastActiveAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction('Edit User', user.displayName)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction('Send Email', user.displayName)
                              }
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction('Deactivate', user.displayName)
                              }
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search groups..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>

          {/* Groups Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockGroups.map((group, index) => {
              const memberCount = getMemberCount(group.id)
              const members = groupMemberships
                .find((gm) => gm.groupId === group.id)
                ?.userIds.slice(0, 4)
                .map((uid) => extendedUsers.find((u) => u.id === uid))
                .filter(Boolean)

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 stagger-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold mb-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {group.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members?.map((member) => (
                        <Avatar
                          key={member?.id}
                          className="h-8 w-8 border-2 border-card"
                        >
                          <AvatarFallback className="text-xs">
                            {member?.displayName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {memberCount > 4 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium">
                          +{memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {memberCount} members
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
