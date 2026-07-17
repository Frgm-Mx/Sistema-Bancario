import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import api from '../api/axios'
import type { Account, Transaction } from '../types'

export default function Transfer() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [history, setHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    sourceAccountNumber: '',
    targetAccountNumber: '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts')
        setAccounts(data)
        if (data.length > 0) {
          setForm(f => ({ ...f, sourceAccountNumber: data[0].accountNumber }))
          const { data: txs } = await api.get<Transaction[]>(
            `/transactions/history/${data[0].accountNumber}`
          )
          setHistory(txs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSourceChange = async (accountNumber: string) => {
    setForm(f => ({ ...f, sourceAccountNumber: accountNumber }))
    try {
      const { data } = await api.get<Transaction[]>(`/transactions/history/${accountNumber}`)
      setHistory(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSending(true)
    try {
      await api.post('/transactions/transfer', {
        ...form,
        amount: parseFloat(form.amount),
      })
      setSuccess('Transferencia realizada exitosamente')
      setForm(f => ({ ...f, targetAccountNumber: '', amount: '', description: '' }))
      const { data: txs } = await api.get<Transaction[]>(
        `/transactions/history/${form.sourceAccountNumber}`
      )
      setHistory(txs)
      const { data: accs } = await api.get<Account[]>('/accounts')
      setAccounts(accs)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al realizar la transferencia')
    } finally {
      setSending(false)
    }
  }

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
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-white">Transferencias</h1>
          <p className="text-white/40 text-sm mt-1">Envía dinero entre cuentas</p>
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>}
            title="Necesitas una cuenta para transferir"
            description="Primero abre una cuenta bancaria. Una vez que tengas una cuenta activa podrás realizar transferencias."
            action={{ label: 'Abrir mi primera cuenta', to: '/accounts' }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-medium mb-5">Nueva transferencia</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/40 mb-1.5">Cuenta origen</label>
                  <select
                    value={form.sourceAccountNumber}
                    onChange={e => handleSourceChange(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.accountNumber}
                        style={{ background: '#0f0f1a' }}>
                        {acc.type} — {formatCurrency(acc.balance)} — ···{acc.accountNumber.slice(-4)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-white/40 mb-1.5">Número de cuenta destino</label>
                  <input type="text"
                    value={form.targetAccountNumber}
                    onChange={e => setForm({ ...form, targetAccountNumber: e.target.value })}
                    className="w-full glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                    placeholder="Número completo de la cuenta destino"
                    required />
                </div>

                <div>
                  <label className="block text-sm text-white/40 mb-1.5">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input type="number" min="0.01" step="0.01"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="w-full glass rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="0.00" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/40 mb-1.5">Descripción (opcional)</label>
                  <input type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Concepto de la transferencia" />
                </div>

                <button type="submit" disabled={sending}
                  className="w-full gradient-blue glow-blue text-white font-medium py-2.5 rounded-xl transition-all text-sm mt-2 disabled:opacity-50 hover:scale-[1.01]">
                  {sending ? 'Enviando...' : 'Transferir'}
                </button>
              </form>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-medium mb-4">Historial reciente</h2>
              {history.length === 0 ? (
                <p className="text-white/30 text-sm">No hay movimientos aún</p>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {history.map((tx, i) => (
                    <div key={tx.id}
                      className={`flex items-center justify-between py-3 ${
                        i < history.length - 1 ? 'border-b border-white/5' : ''
                      }`}>
                      <div>
                        <p className="text-white text-sm">{tx.description || 'Transferencia'}</p>
                        <p className="text-white/30 text-xs mt-0.5">{formatDate(tx.createdAt)}</p>
                        <p className="text-white/20 text-xs mt-0.5 font-mono">
                          → ···{tx.targetAccountNumber.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-white text-sm font-semibold">{formatCurrency(tx.amount)}</p>
                        <span className={`text-xs ${
                          tx.status === 'COMPLETADA' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </Layout>
  )
}