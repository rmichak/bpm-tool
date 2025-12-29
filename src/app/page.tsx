'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRole } from '@/contexts/RoleContext'
import {
  Inbox,
  GitBranch,
  ArrowRight,
  LayoutDashboard,
  Users,
  Settings,
  ListTodo,
  History,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const stats = [
  { label: 'Active Workflows', value: '12', icon: GitBranch },
  { label: 'Items Processed', value: '1,247', icon: CheckCircle2 },
  { label: 'Avg. Completion', value: '4.2h', icon: Clock },
  { label: 'Efficiency', value: '+15%', icon: TrendingUp },
]

const adminQuickLinks = [
  {
    title: 'Dashboard',
    description: 'Monitor performance and analytics',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Processes',
    description: 'Manage workflows and configurations',
    href: '/admin/processes',
    icon: GitBranch,
    color: 'from-violet-500/20 to-purple-500/20',
  },
  {
    title: 'Users & Groups',
    description: 'Manage team members and permissions',
    href: '/admin/users',
    icon: Users,
    color: 'from-green-500/20 to-emerald-500/20',
  },
  {
    title: 'Settings',
    description: 'Configure platform preferences',
    href: '/admin/settings',
    icon: Settings,
    color: 'from-orange-500/20 to-amber-500/20',
  },
]

const userQuickLinks = [
  {
    title: 'My Inbox',
    description: 'View and complete assigned tasks',
    href: '/inbox',
    icon: Inbox,
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Queue Browser',
    description: 'Claim work from group queues',
    href: '/queues',
    icon: ListTodo,
    color: 'from-violet-500/20 to-purple-500/20',
  },
  {
    title: 'History',
    description: 'View completed work items',
    href: '/history',
    icon: History,
    color: 'from-green-500/20 to-emerald-500/20',
  },
]

export default function HomePage() {
  const { isAdmin } = useRole()
  const quickLinks = isAdmin ? adminQuickLinks : userQuickLinks

  return (
    <div className="container py-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Workflow Management Platform
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            John
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isAdmin
            ? "Monitor your organization's workflows, manage users, and optimize business processes."
            : 'Access your work queue, complete tasks, and track your progress.'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6 text-center stagger-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <div
                className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 stagger-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <link.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {link.description}
                  </p>
                  <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                    Open
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Role-specific CTA */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {isAdmin ? 'Build Your Next Workflow' : 'Ready to Work?'}
            </h2>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Create and configure business processes with our visual workflow builder.'
                : 'Start processing your assigned tasks and complete work items.'}
            </p>
          </div>
          <Link href={isAdmin ? '/builder' : '/inbox'}>
            <Button size="lg" className="gap-2 px-6">
              {isAdmin ? (
                <>
                  <GitBranch className="h-5 w-5" />
                  Open Builder
                </>
              ) : (
                <>
                  <Inbox className="h-5 w-5" />
                  Go to Inbox
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          ePower BPM Platform &bull; Visual Mockup with Mock Data
        </p>
      </div>
    </div>
  )
}
