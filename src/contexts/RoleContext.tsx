'use client'

import * as React from 'react'

export type Role = 'admin' | 'user'

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
  isAdmin: boolean
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined)

const STORAGE_KEY = 'epowerbpm-role'

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>('user')
  const [mounted, setMounted] = React.useState(false)

  // Load from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'admin' || stored === 'user') {
      setRoleState(stored)
    }
    setMounted(true)
  }, [])

  // Save to localStorage when role changes
  const setRole = React.useCallback((newRole: Role) => {
    setRoleState(newRole)
    localStorage.setItem(STORAGE_KEY, newRole)
  }, [])

  const value = React.useMemo(
    () => ({
      role,
      setRole,
      isAdmin: role === 'admin',
    }),
    [role, setRole]
  )

  // Prevent hydration mismatch by rendering a placeholder until mounted
  if (!mounted) {
    return (
      <RoleContext.Provider value={{ role: 'user', setRole: () => {}, isAdmin: false }}>
        {children}
      </RoleContext.Provider>
    )
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = React.useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
