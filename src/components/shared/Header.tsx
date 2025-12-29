'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useRole } from '@/contexts/RoleContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Inbox,
  GitBranch,
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  Shield,
  User,
  ListTodo,
  History,
  Zap,
} from 'lucide-react'

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Processes', href: '/admin/processes', icon: GitBranch },
  { name: 'Users & Groups', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const userNavigation = [
  { name: 'My Inbox', href: '/inbox', icon: Inbox },
  { name: 'Queues', href: '/queues', icon: ListTodo },
  { name: 'History', href: '/history', icon: History },
]

export function Header() {
  const pathname = usePathname()
  const { role, setRole, isAdmin } = useRole()

  const navigation = isAdmin ? adminNavigation : userNavigation

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-colors" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">ePower</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">
                BPM Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[17px] h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm">
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md',
                    isAdmin
                      ? 'bg-warning/20 text-warning'
                      : 'bg-primary/20 text-primary'
                  )}
                >
                  {isAdmin ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>
                <span className="font-medium">
                  {isAdmin ? 'Admin' : 'User'} View
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Switch View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setRole('admin')}
                className={cn(role === 'admin' && 'bg-muted')}
              >
                <Shield className="h-4 w-4 mr-2 text-warning" />
                Admin View
                {role === 'admin' && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRole('user')}
                className={cn(role === 'user' && 'bg-muted')}
              >
                <User className="h-4 w-4 mr-2 text-primary" />
                User View
                {role === 'user' && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="text-sm font-semibold">
                    JS
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    john@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
