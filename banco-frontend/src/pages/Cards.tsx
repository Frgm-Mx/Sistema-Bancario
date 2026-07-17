import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import api from '../api/axios'
import type { Account, Card } from '../types'

export default function Cards() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    accountNumber: '',
    type: 'DEBITO' as 'DEBITO' | 'CREDITO',
    creditLimit: '',
  })

  const fetchCards = async (accs: Account[]) => {
    const allCards: Card[] = []
    for (const acc of accs) {
      try {
        const { data } = await api.get<Card[]>(`/cards/${acc.accountNumber}`)
        allCards.push(...data)
      } catch (err) {
        console.error(err)
      }
    }
    setCards(allCards)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts')
        setAccounts(data)
        if (data.length > 0) {
          setForm(f => ({ ...f, accountNumber: data[0].accountNumber }))
          await fetchCards(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/cards', {
        accountNumber: form.accountNumber,
        type: form.type,
        creditLimit: form.type === 'CREDITO' ? parseFloat(form.creditLimit) : 0,
      })
      setSuccess('Tarjeta creada exitosamente')
      setShowForm(false)
      await fetchCards(accounts)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al crear la tarjeta')
    } finally {
      setCreating(false)
    }
  }

  const handleBlock = async (cardNumber: string) => {
    try {
      await api.patch(`/cards/block/${cardNumber}`)
      setSuccess('Tarjeta bloqueada')
      await fetchCards(accounts)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al bloquear')
    }
  }

  const handleActivate = async (cardNumber: string) => {
    try {
      await api.patch(`/cards/activate/${cardNumber}`)
      setSuccess('Tarjeta activada')
      await fetchCards(accounts)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Error al activar')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatExpiry = (date: string) =>
    new Intl.DateTimeFormat('es-MX', { month: '2-digit', year: '2-digit' }).format(new Date(date))

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
            <h1 className="text-2xl font-semibold text-white">Tarjetas</h1>
            <p className="text-white/40 text-sm mt-1">Gestiona tus tarjetas bancarias</p>
          </div>
          {accounts.length > 0 && (
            <button
              onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
              className="gradient-purple glow-purple text-white text-sm px-4 py-2.5 rounded-xl transition-all">
              + Nueva tarjeta
            </button>
          )}
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

        {accounts.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            title="Necesitas una cuenta para crear tarjetas"
            description="Las tarjetas se asocian a una cuenta bancaria. Abre tu primera cuenta y después podrás solicitar una tarjeta."
            action={{ label: 'Abrir mi primera cuenta', to: '/accounts' }}
          />
        ) : (
          <>
            {showForm && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-white font-medium mb-4">Nueva tarjeta</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/40 mb-1.5">Cuenta asociada</label>
                    <select value={form.accountNumber}
                      onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                      className="w-full glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-colors">
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.accountNumber}
                          style={{ background: '#0f0f1a' }}>
                          {acc.type} — ···{acc.accountNumber.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/40 mb-2">Tipo de tarjeta</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['DEBITO', 'CREDITO'] as const).map(t => (
                        <button key={t} onClick={() => setForm({ ...form, type: t })}
                          className={`p-4 rounded-xl border text-sm transition-all text-left ${
                            form.type === t
                              ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                              : 'border-white/5 text-white/40 hover:border-white/10'
                          }`}>
                          <p className="font-medium">{t}</p>
                          <p className="text-xs mt-1 font-normal opacity-70">
                            {t === 'DEBITO' ? 'Usa tu saldo disponible' : 'Línea de crédito asignada por tu score'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.type === 'CREDITO' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
                      El límite de crédito se asigna automáticamente según tu score crediticio. No es necesario especificarlo.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleCreate} disabled={creating}
                      className="gradient-purple glow-purple text-white text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                      {creating ? 'Creando...' : 'Crear tarjeta'}
                    </button>
                    <button onClick={() => setShowForm(false)}
                      className="glass text-white/40 hover:text-white text-sm px-5 py-2.5 rounded-xl transition-all">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cards.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-white/30 text-sm">No tienes tarjetas aún. Crea tu primera tarjeta.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div key={card.id} className="glass rounded-2xl overflow-hidden">
                    <div className={`p-6 ${
                      card.type === 'CREDITO' ? 'gradient-purple glow-purple' : 'gradient-blue glow-blue'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-white/70 text-xs font-medium tracking-widest">
                          {card.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          card.status === 'ACTIVE'
                            ? 'bg-white/20 text-white'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {card.status === 'ACTIVE' ? 'Activa' : card.status}
                        </span>
                      </div>
                      <p className="text-white font-mono text-lg tracking-widest mb-5">
                        {card.cardNumber}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/40 text-xs mb-1">CVV</p>
                          <p className="text-white text-sm font-mono">{card.cvv}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Vence</p>
                          <p className="text-white text-sm">{formatExpiry(card.expirationDate)}</p>
                        </div>
                        {card.type === 'CREDITO' && (
                          <div className="text-right">
                            <p className="text-white/40 text-xs mb-1">Límite</p>
                            <p className="text-white text-sm font-semibold">
                              {formatCurrency(card.creditLimit)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/30">Cuenta asociada</span>
                        <span className="text-white/50 font-mono">···{card.accountNumber.slice(-4)}</span>
                      </div>
                      {card.type === 'CREDITO' && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/30">Crédito usado</span>
                            {/* Corregido con fallback a 0 si viene undefined */}
                            <span className="text-white/50">{formatCurrency(card.usedCredit || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/30">Disponible</span>
                            {/* Corregido con fallback a 0 si viene undefined */}
                            <span className="text-green-400">{formatCurrency(card.availableCredit || 0)}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full gradient-purple rounded-full transition-all"
                              style={{ width: card.creditLimit > 0
                                ? `${((card.usedCredit || 0) / card.creditLimit) * 100}%`
                                : '0%' }} />
                          </div>
                        </>
                      )}
                      <div className="flex gap-2 pt-1">
                        {card.status === 'ACTIVE' ? (
                          <button onClick={() => handleBlock(card.cardNumber)}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs py-2 rounded-lg transition-colors">
                            Bloquear
                          </button>
                        ) : card.status === 'BLOCKED' ? (
                          <button onClick={() => handleActivate(card.cardNumber)}
                            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs py-2 rounded-lg transition-colors">
                            Activar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </Layout>
  )
}