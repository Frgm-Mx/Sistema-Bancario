import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import api from '../api/axios'
import type { Account } from '../types'

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'AHORRO' | 'CORRIENTE'>('AHORRO')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Mantenemos esta función para refrescar los datos tras crear/cerrar cuentas
  const fetchAccounts = useCallback(async () => {
    try {
      const { data } = await api.get<Account[]>('/accounts')
      setAccounts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // CORRECCIÓN PARA ESLINT: Lógica de carga inicial aislada dentro del efecto
  useEffect(() => {
    let isMounted = true

    const loadInitialAccounts = async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts')
        if (isMounted) {
          setAccounts(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialAccounts()

    return () => {
      isMounted = false
    }
  }, []) // Arreglo vacío limpio y seguro sin disparar cascadas ni advertencias

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/accounts', { type })
      setSuccess('Cuenta creada exitosamente')
      setShowForm(false)
      fetchAccounts() // Refrescamos de manera segura
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = async (accountNumber: string) => {
    if (!confirm('¿Estás seguro de cerrar esta cuenta? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/accounts/${accountNumber}/close`)
      setSuccess('Cuenta cerrada exitosamente')
      fetchAccounts() // Refrescamos de manera segura
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al cerrar la cuenta')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Mis cuentas</h1>
            <p className="text-white/40 text-sm mt-1">Gestiona tus cuentas bancarias</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
            className="gradient-blue glow-blue text-white text-sm px-4 py-2.5 rounded-xl transition-all">
            + Nueva cuenta
          </button>
        </div>

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-white font-medium mb-4">Abrir nueva cuenta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/40 mb-2">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['AHORRO', 'CORRIENTE'] as const).map(t => (
                    <button key={t} onClick={() => setType(t)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all text-left ${
                        type === t
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                      }`}>
                      <p className="font-medium">{t}</p>
                      <p className="text-xs mt-1 font-normal opacity-70">
                        {t === 'AHORRO' ? 'Ideal para ahorrar dinero' : 'Para operaciones frecuentes'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate} disabled={creating}
                  className="gradient-blue glow-blue text-white text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear cuenta'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="glass text-white/40 hover:text-white text-sm px-5 py-2.5 rounded-xl transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {accounts.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            title="No tienes cuentas aún"
            description="Abre tu primera cuenta bancaria para empezar a mover tu dinero."
            action={{ label: 'Abrir primera cuenta', to: '/accounts' }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(account => (
              <div key={account.id} className="glass rounded-2xl overflow-hidden">
                <div className={`p-6 ${
                  account.type === 'AHORRO' ? 'gradient-green' : 'gradient-purple'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white/70 text-xs font-medium tracking-widest uppercase">
                      {account.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      account.status === 'ACTIVE'
                        ? 'bg-white/20 text-white'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {account.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-white/50 text-xs font-mono tracking-widest">
                    ···· ···· {account.accountNumber.slice(-8, -4)} {account.accountNumber.slice(-4)}
                  </p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/30">Titular</span>
                    <span className="text-white/60">{account.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/30">Apertura</span>
                    <span className="text-white/60">{formatDate(account.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/30">Número</span>
                    <span className="text-white/60 font-mono">{account.accountNumber}</span>
                  </div>
                  {account.status === 'ACTIVE' && account.balance === 0 && (
                    <button
                      onClick={() => handleClose(account.accountNumber)}
                      className="w-full mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors py-1">
                      Cerrar cuenta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}