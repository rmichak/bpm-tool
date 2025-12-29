'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Bell,
  Clock,
  Plug,
  Shield,
  Save,
  Check,
  X,
} from 'lucide-react'

const settingsSections = [
  { id: 'general', name: 'General', icon: Building2 },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'sla', name: 'SLA Rules', icon: Clock },
  { id: 'integrations', name: 'Integrations', icon: Plug },
  { id: 'security', name: 'Security', icon: Shield },
]

const integrations = [
  { id: 'email', name: 'Email (SMTP)', description: 'Send notifications via email', connected: true },
  { id: 'slack', name: 'Slack', description: 'Post updates to Slack channels', connected: false },
  { id: 'teams', name: 'Microsoft Teams', description: 'Integrate with Teams', connected: false },
  { id: 'webhook', name: 'Webhooks', description: 'Send events to external systems', connected: true },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState('general')

  const handleSave = (section: string) => {
    toast({
      title: 'Settings Saved',
      description: `${section} settings have been updated. (Mockup)`,
      variant: 'success',
    })
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your platform preferences and integrations
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">General Settings</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Name</label>
                  <input
                    type="text"
                    defaultValue="Acme Corporation"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Timezone</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>America/New_York (EST)</option>
                    <option>America/Los_Angeles (PST)</option>
                    <option>Europe/London (GMT)</option>
                    <option>Asia/Tokyo (JST)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Format</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Enable dark theme by default
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={() => handleSave('General')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeSection === 'notifications' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Notification Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Task Assignments</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks are assigned to you
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">SLA Warnings</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts before SLA deadlines
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Process Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about workflow changes
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notification Digest Frequency
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Real-time</option>
                    <option>Hourly digest</option>
                    <option>Daily digest</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={() => handleSave('Notification')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* SLA Settings */}
          {activeSection === 'sla' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">SLA Rules</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Default SLA Duration
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue="24"
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select className="w-24 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option>Hours</option>
                        <option>Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Warning Threshold</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue="75"
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alert when this % of SLA time has elapsed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Escalation Action</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Notify supervisor</option>
                    <option>Reassign to queue</option>
                    <option>Escalate to admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Escalation</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically escalate overdue items
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={() => handleSave('SLA')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeSection === 'integrations' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Integrations</h2>

              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center',
                          integration.connected
                            ? 'bg-success/10'
                            : 'bg-muted'
                        )}
                      >
                        <Plug
                          className={cn(
                            'h-5 w-5',
                            integration.connected
                              ? 'text-success'
                              : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{integration.name}</p>
                          {integration.connected && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-success/10 text-success border-success/20"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={integration.connected ? 'outline' : 'default'}
                      size="sm"
                    >
                      {integration.connected ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Security Settings</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue="60"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">SSO (Single Sign-On)</p>
                    <p className="text-sm text-muted-foreground">
                      Enable enterprise SSO authentication
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Policy</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Standard (8+ characters)</option>
                    <option>Strong (12+ with special chars)</option>
                    <option>Enterprise (14+ with complexity)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Audit Logging</p>
                    <p className="text-sm text-muted-foreground">
                      Log all user actions for compliance
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={() => handleSave('Security')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
