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
