import type { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Navbar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}