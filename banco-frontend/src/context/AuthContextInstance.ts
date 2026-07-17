import { createContext } from 'react'
import type { User } from '../types'

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

// Aquí solo vive el objeto del contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined)