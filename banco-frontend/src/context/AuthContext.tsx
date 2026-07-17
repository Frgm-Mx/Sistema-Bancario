import { useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { AuthContext } from './AuthContextInstance' // <-- Importamos la instancia

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })

  const login = (user: User, token: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      isAdmin: !!token && JSON.parse(localStorage.getItem('user') || '{}').role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  )
}