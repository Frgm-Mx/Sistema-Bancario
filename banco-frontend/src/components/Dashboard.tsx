import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import api from '../api/axios'
import type { Account, Transaction } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts')
        setAccounts(data)
        if (data.length > 0) {
          const { data: txs } = await api.get<Transaction[]>(
            `/transactions/history/${data[0].accountNumber}`
          )
          setTransactions(txs.slice(0, 5))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-semibold text-white">
            Buen día, {user?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Aquí está el resumen de tus finanzas</p>
        </div>

        {/* Balance total */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
          <p className="text-blue-200 text-sm mb-1">Balance total</p>
          <p className="text-white text-4xl font-semibold">{formatCurrency(totalBalance)}</p>
          <p className="text-blue-200 text-sm mt-2">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} activa{accounts.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Cuentas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Mis cuentas</h2>
            <button
              onClick={() => navigate('/accounts')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm mb-4">No tienes cuentas aún</p>
              <button
                onClick={() => navigate('/accounts')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Crear cuenta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(account => (
                <div key={account.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      account.type === 'AHORRO'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {account.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      account.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {account.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-white mb-1">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-gray-500 text-xs font-mono">
                    {account.accountNumber.slice(0, 4)}...{account.accountNumber.slice(-4)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div>
          <h2 className="text-white font-medium mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/transfer')}
              className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 text-left transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600/20 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-white text-sm font-medium">Transferir</p>
              <p className="text-gray-500 text-xs mt-0.5">Enviar dinero</p>
            </button>

            <button
              onClick={() => navigate('/accounts')}
              className="bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-2xl p-5 text-left transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-600/20 transition-colors">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-white text-sm font-medium">Nueva cuenta</p>
              <p className="text-gray-500 text-xs mt-0.5">Abrir cuenta</p>
            </button>

            <button
              onClick={() => navigate('/cards')}
              className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl p-5 text-left transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600/20 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-white text-sm font-medium">Tarjetas</p>
              <p className="text-gray-500 text-xs mt-0.5">Gestionar tarjetas</p>
            </button>
          </div>
        </div>

        {/* Últimas transacciones */}
        {transactions.length > 0 && (
          <div>
            <h2 className="text-white font-medium mb-4">Últimos movimientos</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < transactions.length - 1 ? 'border-b border-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.status === 'COMPLETADA' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <svg className={`w-4 h-4 ${tx.status === 'COMPLETADA' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.description || 'Transferencia'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      tx.status === 'COMPLETADA' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}