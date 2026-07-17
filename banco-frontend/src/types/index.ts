export interface User {
  email: string
  nombre: string
  role: string
}

export interface Account {
  id: number
  accountNumber: string
  type: 'AHORRO' | 'CORRIENTE'
  balance: number
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  ownerName: string
  createdAt: string
}

export interface Transaction {
  id: number
  sourceAccountNumber: string
  targetAccountNumber: string
  amount: number
  type: 'TRANSFERENCIA' | 'DEPOSITO' | 'RETIRO'
  status: 'COMPLETADA' | 'FALLIDA' | 'PENDIENTE'
  description: string
  createdAt: string
}

export interface Card {
  id: number
  cardNumber: string
  cvv: string
  type: 'DEBITO' | 'CREDITO'
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CANCELLED'
  creditLimit: number
  expirationDate: string
  accountNumber: string
  createdAt: string
  usedCredit?: number;      
  availableCredit?: number;
}

export interface AuthResponse {
  token: string
  email: string
  nombre: string
  role: string
}