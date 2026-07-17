import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

// ── Types ──────────────────────────────────────────────
interface Stats {
  totalUsers: number
  totalAccounts: number
  totalTransactions: number
  totalMoneyInSystem: number
  transactionsToday: number
  activeCards: number
  blockedAccounts: number
  blockedUsers: number
  averageBalance: number
}

interface AccountInfo {
  id: number
  accountNumber: string
  type: string
  balance: number
  status: string
}

interface AdminUser {
  id: number
  nombre: string
  email: string
  role: string
  totalAccounts: number
  totalBalance: number
  creditScore: number
  creditRating: string
  accounts: AccountInfo[]
}

interface AdminTransaction {
  id: number
  sourceAccountNumber: string
  targetAccountNumber: string
  sourceOwner: string
  targetOwner: string
  amount: number
  type: string
  status: string
  description: string
  createdAt: string
}

interface SecurityLog {
  id: number
  email: string
  attempts: number
  blocked: boolean
  blockedUntil: string
  lastAttempt: string
  minutesUntilUnblock: number
}

interface ChartData {
  byType: Record<string, number>
  byDay: Record<string, number>
  scoreDistribution: Record<string, number>
  balanceByType: Record<string, number>
}

// ── Helpers ──────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))

const ratingColor: Record<string, string> = {
  EXCELENTE: 'text-green-400',
  BUENO: 'text-blue-400',
  REGULAR: 'text-amber-400',
  MALO: 'text-red-400',
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
const TYPE_COLORS: Record<string, string> = {
  TRANSFERENCIA: '#3b82f6',
  DEPOSITO: '#22c55e',
  RETIRO: '#f59e0b',
}

// ── Tab type ──────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'transactions' | 'security' | 'charts'

// ── Formatter seguro para Recharts ──
// Usar tipo más específico en lugar de any
const safeCurrencyFormatter = (value: number | string | null | undefined): string => {
  if (value === undefined || value === null) return '$0.00'
  if (typeof value === 'number') return formatCurrency(value)
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return isNaN(num) ? '$0.00' : formatCurrency(num)
  }
  return '$0.00'
}

// ── Component ──────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [txPage, setTxPage] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [newScore, setNewScore] = useState('')
  const [depositForm, setDepositForm] = useState({ accountNumber: '', amount: '', description: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // ── Funciones declaradas ANTES del useEffect ──
  
  const loadAll = async () => {
    try {
      const [statsRes, usersRes, txRes, logsRes, chartsRes] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        api.get<AdminUser[]>('/admin/users'),
        api.get<{ content: AdminTransaction[]; totalPages: number }>('/admin/transactions?page=0&size=15'),
        api.get<SecurityLog[]>('/admin/security/logs'),
        api.get<ChartData>('/admin/charts'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setTransactions(txRes.data.content)
      setTxTotalPages(txRes.data.totalPages)
      setSecurityLogs(logsRes.data)
      setChartData(chartsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (page: number) => {
    const { data } = await api.get<{ content: AdminTransaction[]; totalPages: number }>(
      `/admin/transactions?page=${page}&size=15`
    )
    setTransactions(data.content)
    setTxTotalPages(data.totalPages)
    setTxPage(page)
  }

  const notify = (message: string, isError = false) => {
    if (isError) setError(message)
    else setMsg(message)
    setTimeout(() => { setMsg(''); setError('') }, 3000)
  }

  const handleBlock = async (accountNumber: string) => {
    try {
      await api.patch(`/admin/accounts/${accountNumber}/block`)
      notify('Cuenta bloqueada')
      await loadAll()
    } catch { notify('Error al bloquear', true) }
  }

  const handleUnblock = async (accountNumber: string) => {
    try {
      await api.patch(`/admin/accounts/${accountNumber}/unblock`)
      notify('Cuenta desbloqueada')
      await loadAll()
    } catch { notify('Error al desbloquear', true) }
  }

  const handleUnblockLogin = async (email: string) => {
    try {
      await api.patch(`/admin/security/unblock/${email}`)
      notify('Usuario desbloqueado')
      await loadAll()
    } catch { notify('Error', true) }
  }

  const handleUpdateScore = async (userId: number) => {
    if (!newScore) return
    try {
      await api.patch(`/admin/users/${userId}/credit-score`, { score: parseInt(newScore) })
      notify('Score actualizado')
      setNewScore('')
      await loadAll()
    } catch { notify('Error al actualizar score', true) }
  }

  const handlePromote = async (userId: number) => {
    if (!confirm('¿Promover este usuario a ADMIN?')) return
    try {
      await api.patch(`/admin/users/${userId}/promote`)
      notify('Usuario promovido')
      await loadAll()
    } catch { notify('Error', true) }
  }

  const handleDeposit = async () => {
    if (!depositForm.accountNumber || !depositForm.amount) return
    try {
      await api.post(`/admin/accounts/${depositForm.accountNumber}/deposit`, {
        amount: parseFloat(depositForm.amount),
        description: depositForm.description || 'Depósito ejecutivo',
      })
      notify('Depósito realizado')
      setDepositForm({ accountNumber: '', amount: '', description: '' })
      await loadAll()
    } catch { notify('Error al depositar', true) }
  }

  // ── useEffect AHORA DESPUÉS de las declaraciones ──
  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return }
    // Call loadAll asynchronously to avoid synchronous setState inside effect
    const fetchAll = async () => { await loadAll() }
    void fetchAll()
  }, [isAdmin, navigate])

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'transactions', label: 'Transacciones', icon: '↔️' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'charts', label: 'Gráficas', icon: '📈' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-amber rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Panel ejecutivo</h1>
            <p className="text-white/40 text-sm">Administración del sistema bancario</p>
          </div>
        </div>

        {/* Feedback */}
        {msg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">{msg}</div>}
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                tab === t.id
                  ? 'gradient-amber text-white'
                  : 'glass text-white/40 hover:text-white'
              }`}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Usuarios', value: stats.totalUsers, color: 'text-blue-400', sub: 'registrados' },
                { label: 'Cuentas activas', value: stats.totalAccounts, color: 'text-green-400', sub: 'en el sistema' },
                { label: 'Transacciones', value: stats.totalTransactions, color: 'text-purple-400', sub: 'totales' },
                { label: 'Hoy', value: stats.transactionsToday, color: 'text-pink-400', sub: 'transacciones' },
                { label: 'Tarjetas activas', value: stats.activeCards, color: 'text-cyan-400', sub: 'emitidas' },
                { label: 'Cuentas bloqueadas', value: stats.blockedAccounts, color: 'text-red-400', sub: 'bloqueadas' },
                { label: 'Usuarios bloqueados', value: stats.blockedUsers, color: 'text-red-400', sub: 'por intentos' },
                { label: 'Saldo promedio', value: formatCurrency(stats.averageBalance), color: 'text-amber-400', sub: 'por cuenta' },
              ].map(s => (
                <div key={s.label} className="glass rounded-2xl p-5">
                  <p className="text-white/30 text-xs mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-white/20 text-xs mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Balance total destacado */}
            <div className="gradient-amber rounded-2xl p-6">
              <p className="text-amber-100 text-sm mb-1">Dinero total en el sistema</p>
              <p className="text-white text-4xl font-bold">{formatCurrency(stats.totalMoneyInSystem)}</p>
            </div>

            {/* Depósito ejecutivo */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-medium mb-4">Depósito ejecutivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={depositForm.accountNumber}
                  onChange={e => setDepositForm({ ...depositForm, accountNumber: e.target.value })}
                  className="glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  placeholder="Número de cuenta" />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                  <input type="number" min="0.01"
                    value={depositForm.amount}
                    onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className="w-full glass rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none"
                    placeholder="Monto" />
                </div>
                <input
                  value={depositForm.description}
                  onChange={e => setDepositForm({ ...depositForm, description: e.target.value })}
                  className="glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  placeholder="Descripción (opcional)" />
              </div>
              <button onClick={handleDeposit}
                className="mt-3 gradient-amber text-white text-sm px-5 py-2.5 rounded-xl transition-all">
                Acreditar depósito
              </button>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-white font-medium">Usuarios ({users.length})</h2>
              </div>
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {users.map(user => (
                  <div key={user.id}
                    onClick={() => { setSelectedUser(user); setNewScore('') }}
                    className={`px-5 py-4 cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? 'bg-amber-500/10 border-l-2 border-amber-500'
                        : 'hover:bg-white/3'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                          user.role === 'ADMIN' ? 'gradient-amber' : 'gradient-blue'
                        }`}>
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.nombre}</p>
                          <p className="text-white/30 text-xs">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${ratingColor[user.creditRating] || 'text-white/30'}`}>
                          {user.creditScore} pts
                        </p>
                        <p className="text-white/30 text-xs">{formatCurrency(user.totalBalance)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUser ? (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-medium">{selectedUser.nombre}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedUser.role === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>{selectedUser.role}</span>
                </div>
                <div className="p-5 space-y-5 max-h-[560px] overflow-y-auto">

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-xl p-3">
                      <p className="text-white/30 text-xs mb-1">Balance total</p>
                      <p className="text-white font-semibold text-sm">{formatCurrency(selectedUser.totalBalance)}</p>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <p className="text-white/30 text-xs mb-1">Score</p>
                      <p className={`font-semibold text-sm ${ratingColor[selectedUser.creditRating]}`}>
                        {selectedUser.creditScore} — {selectedUser.creditRating}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-white/30 text-xs mb-2">Cuentas</p>
                    {selectedUser.accounts.map(acc => (
                      <div key={acc.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white text-xs font-medium">{acc.type}</p>
                          <p className="text-white/30 text-xs font-mono">···{acc.accountNumber.slice(-4)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-white text-sm font-semibold">{formatCurrency(acc.balance)}</p>
                          {acc.status === 'ACTIVE' ? (
                            <button onClick={() => handleBlock(acc.accountNumber)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-lg transition-colors">
                              Bloquear
                            </button>
                          ) : acc.status === 'BLOCKED' ? (
                            <button onClick={() => handleUnblock(acc.accountNumber)}
                              className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded-lg transition-colors">
                              Desbloquear
                            </button>
                          ) : (
                            <span className="text-xs text-white/20">{acc.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-white/30 text-xs mb-2">Ajustar score crediticio</p>
                    <div className="flex gap-2">
                      <input type="number" min="300" max="850"
                        value={newScore}
                        onChange={e => setNewScore(e.target.value)}
                        className="flex-1 glass rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                        placeholder="300 — 850" />
                      <button onClick={() => handleUpdateScore(selectedUser.id)}
                        className="gradient-amber text-white text-xs px-4 py-2 rounded-xl">
                        Actualizar
                      </button>
                    </div>
                  </div>

                  {selectedUser.role !== 'ADMIN' && (
                    <button onClick={() => handlePromote(selectedUser.id)}
                      className="w-full glass text-amber-400/60 hover:text-amber-400 text-xs py-2.5 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all">
                      Promover a ejecutivo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-white/20 text-sm">Selecciona un usuario</p>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab === 'transactions' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-white font-medium">Todas las transacciones</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['ID', 'Tipo', 'Origen', 'Destino', 'Monto', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-white/30 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-white/40 text-xs">#{tx.id}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            background: `${TYPE_COLORS[tx.type]}15`,
                            color: TYPE_COLORS[tx.type]
                          }}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-white text-xs">{tx.sourceOwner}</p>
                        <p className="text-white/30 text-xs font-mono">···{tx.sourceAccountNumber.slice(-4)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-white text-xs">{tx.targetOwner}</p>
                        <p className="text-white/30 text-xs font-mono">···{tx.targetAccountNumber.slice(-4)}</p>
                      </td>
                      <td className="px-5 py-3 text-white text-sm font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs ${
                          tx.status === 'COMPLETADA' ? 'text-green-400' : 'text-red-400'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="px-5 py-3 text-white/30 text-xs">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-white/30 text-xs">Página {txPage + 1} de {txTotalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => loadTransactions(txPage - 1)} disabled={txPage === 0}
                  className="px-3 py-1.5 glass text-white/40 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-all">
                  ← Anterior
                </button>
                <button onClick={() => loadTransactions(txPage + 1)} disabled={txPage >= txTotalPages - 1}
                  className="px-3 py-1.5 glass text-white/40 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-all">
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {tab === 'security' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-white font-medium">Logs de seguridad — intentos de login</h2>
              </div>
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <p className="px-5 py-8 text-white/20 text-sm text-center">Sin registros</p>
                ) : securityLogs.map(log => (
                  <div key={log.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.blocked ? 'bg-red-500/10' : 'bg-amber-500/10'
                      }`}>
                        <svg className={`w-4 h-4 ${log.blocked ? 'text-red-400' : 'text-amber-400'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm">{log.email}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {log.attempts} intento{log.attempts !== 1 ? 's' : ''} fallido{log.attempts !== 1 ? 's' : ''} · {formatDate(log.lastAttempt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.blocked ? (
                        <>
                          <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">
                            Bloqueado {log.minutesUntilUnblock}min
                          </span>
                          <button onClick={() => handleUnblockLogin(log.email)}
                            className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg transition-colors">
                            Desbloquear
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-white/20">Sin bloqueo activo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTS ── */}
        {tab === 'charts' && chartData && (
          <div className="space-y-6">

            {/* Transacciones por día */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-medium mb-6">Transacciones últimos 7 días</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={Object.entries(chartData.byDay).map(([date, count]) => ({
                  date: date.slice(5), count
                }))}>
                  <XAxis dataKey="date" stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
                  <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: 12 }}
                    labelStyle={{ color: '#ffffff60' }} itemStyle={{ color: '#3b82f6' }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Transacciones por tipo */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-white font-medium mb-6">Transacciones por tipo</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(chartData.byType).map(([type, count]) => ({ type, count }))}>
                    <XAxis dataKey="type" stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
                    <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: 12 }}
                      labelStyle={{ color: '#ffffff60' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {Object.keys(chartData.byType).map((type, i) => (
                        <Cell key={i} fill={TYPE_COLORS[type] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Distribución de scores */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-white font-medium mb-6">Distribución de scores</h2>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie data={Object.entries(chartData.scoreDistribution).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                        dataKey="value" paddingAngle={3}>
                        {Object.keys(chartData.scoreDistribution).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {Object.entries(chartData.scoreDistribution).map(([name, value], i) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-white/50 text-xs">{name}</span>
                        </div>
                        <span className="text-white text-xs font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Saldo por tipo de cuenta */}
              <div className="glass rounded-2xl p-6 md:col-span-2">
                <h2 className="text-white font-medium mb-6">Saldo total por tipo de cuenta</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(chartData.balanceByType).map(([type, balance]) => ({ type, balance }))}>
                    <XAxis dataKey="type" stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 12 }} />
                    <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ background: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: 12 }}
                      formatter={safeCurrencyFormatter} 
                    />
                    <Bar dataKey="balance" radius={[8, 8, 0, 0]}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#7c3aed" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}