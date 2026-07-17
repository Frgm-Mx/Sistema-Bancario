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
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accsRes, notifRes] = await Promise.all([
          api.get<Account[]>('/accounts'),
          api.get<{ unread: number }>('/notifications/count'),
        ])
        setAccounts(accsRes.data)
        setUnread(notifRes.data.unread)
        if (accsRes.data.length > 0) {
          const { data: txs } = await api.get<Transaction[]>(
            `/transactions/history/${accsRes.data[0].accountNumber}`
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
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(date))

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Buen día, {user?.nombre?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/40 mt-1 text-sm">
              {new Intl.DateTimeFormat('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long'
              }).format(new Date())}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-2 glass glass-hover px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-all">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              {unread} notificación{unread !== 1 ? 'es' : ''} nueva{unread !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Balance total */}
        {accounts.length > 0 ? (
          <div className="relative gradient-blue glow-blue rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-16" />
            <div className="relative">
              <p className="text-blue-200 text-sm mb-2">Balance total</p>
              <p className="text-white text-5xl font-bold mb-4">
                {formatCurrency(totalBalance)}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-blue-200 text-sm">
                  {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} activa{accounts.length !== 1 ? 's' : ''}
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-300/50" />
                <button
                  onClick={() => navigate('/accounts')}
                  className="text-blue-200 hover:text-white text-sm transition-colors">
                  Ver cuentas →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-8 text-center border border-dashed border-white/10">
            <p className="text-white/40 text-sm mb-4">No tienes cuentas aún</p>
            <button
              onClick={() => navigate('/accounts')}
              className="gradient-blue glow-blue text-white text-sm px-5 py-2.5 rounded-xl">
              Abrir primera cuenta
            </button>
          </div>
        )}

        {/* Cuentas */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Mis cuentas</h2>
              <button
                onClick={() => navigate('/accounts')}
                className="text-white/40 hover:text-white text-sm transition-colors">
                Ver todas →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(account => (
                <div key={account.id} className="glass glass-hover rounded-2xl p-5 cursor-pointer"
                  onClick={() => navigate('/accounts')}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      account.type === 'AHORRO'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {account.type}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      account.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-white/30 text-xs font-mono">
                    ···· ···· ···· {account.accountNumber.slice(-4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-white font-medium mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Transferir',
                sub: 'Enviar dinero',
                to: '/transfer',
                gradient: 'gradient-blue glow-blue',
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              },
              {
                label: 'Depositar',
                sub: 'Agregar saldo',
                to: '/movements',
                gradient: 'gradient-green glow-green',
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
              },
              {
                label: 'Tarjetas',
                sub: 'Gestionar',
                to: '/cards',
                gradient: 'gradient-purple glow-purple',
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              },
              {
                label: 'Mi score',
                sub: 'Reputación',
                to: '/credit-score',
                gradient: 'gradient-amber',
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              },
            ].map(action => (
              <button
                key={action.to}
                onClick={() => navigate(action.to)}
                className={`${action.gradient} rounded-2xl p-5 text-left transition-all hover:scale-105`}>
                <div className="text-white mb-3">{action.icon}</div>
                <p className="text-white font-medium text-sm">{action.label}</p>
                <p className="text-white/60 text-xs mt-0.5">{action.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Últimos movimientos */}
        {transactions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Últimos movimientos</h2>
              <button
                onClick={() => navigate('/movements')}
                className="text-white/40 hover:text-white text-sm transition-colors">
                Ver todos →
              </button>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              {transactions.map((tx, i) => (
                <div key={tx.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < transactions.length - 1 ? 'border-b border-white/5' : ''
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'DEPOSITO' ? 'bg-green-500/10 text-green-400'
                      : tx.type === 'RETIRO' ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={tx.type === 'DEPOSITO'
                            ? 'M12 4v16m8-8H4'
                            : tx.type === 'RETIRO'
                            ? 'M20 12H4'
                            : 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">
                      {formatCurrency(tx.amount)}
                    </p>
                    <span className={`text-xs ${
                      tx.status === 'COMPLETADA' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin movimientos aún */}
        {accounts.length > 0 && transactions.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-white/40 text-sm mb-4">
              No hay movimientos aún. ¡Empieza depositando o transfiriendo!
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/movements')}
                className="gradient-green text-white text-sm px-4 py-2 rounded-xl">
                Depositar
              </button>
              <button onClick={() => navigate('/transfer')}
                className="gradient-blue text-white text-sm px-4 py-2 rounded-xl">
                Transferir
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}