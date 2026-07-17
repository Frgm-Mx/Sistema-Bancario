import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import api from "../api/axios";
import type { Account } from "../types";

interface PagedResponse {
  content: Transaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface Transaction {
  id: number;
  sourceAccountNumber: string;
  targetAccountNumber: string;
  amount: number;
  type: "TRANSFERENCIA" | "DEPOSITO" | "RETIRO";
  status: "COMPLETADA" | "FALLIDA" | "PENDIENTE";
  description: string;
  createdAt: string;
}

const typeColors = {
  TRANSFERENCIA: "text-blue-400 bg-blue-500/10",
  DEPOSITO: "text-green-400 bg-green-500/10",
  RETIRO: "text-amber-400 bg-amber-500/10",
};

const typeIcons = {
  TRANSFERENCIA: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  DEPOSITO: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  RETIRO: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 12H4"
      />
    </svg>
  ),
};

export default function Movements() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [data, setData] = useState<PagedResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get<Account[]>("/accounts").then(({ data }) => {
      setAccounts(data);
      if (data.length > 0) setSelectedAccount(data[0].accountNumber);
    });
  }, []);

  const fetchHistory = async (accountNumber: string, p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResponse>(
        `/transactions/history/${accountNumber}/paged?page=${p}&size=10`,
      );
      setData(data);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAccount) return;

    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<PagedResponse>(
          `/transactions/history/${selectedAccount}/paged?page=0&size=10`,
        );
        if (isMounted) {
          setData(data);
          setPage(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [selectedAccount]);

  const handleOperation = async (type: "deposit" | "withdraw") => {
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/transactions/${type}`, {
        accountNumber: selectedAccount,
        amount: parseFloat(form.amount),
        description: form.description,
      });
      setSuccess(
        type === "deposit" ? "Depósito realizado" : "Retiro realizado",
      );
      setForm({ amount: "", description: "" });
      setShowDepositForm(false);
      setShowWithdrawForm(false);
      fetchHistory(selectedAccount, 0);
      const { data } = await api.get<Account[]>("/accounts");
      setAccounts(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Error en la operación");
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  const selectedAccountData = accounts.find(
    (a) => a.accountNumber === selectedAccount,
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Movimientos</h1>
            <p className="text-white/40 text-sm mt-1">
              Depósitos, retiros e historial
            </p>
          </div>
          {accounts.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDepositForm(true);
                  setShowWithdrawForm(false);
                  setError("");
                  setSuccess("");
                }}
                className="gradient-green glow-green text-white text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                + Depositar
              </button>
              <button
                onClick={() => {
                  setShowWithdrawForm(true);
                  setShowDepositForm(false);
                  setError("");
                  setSuccess("");
                }}
                className="gradient-amber text-white text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                − Retirar
              </button>
            </div>
          )}
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            title="Sin cuentas disponibles"
            description="Para depositar o retirar dinero primero necesitas abrir una cuenta bancaria."
            action={{ label: 'Abrir mi primera cuenta', to: '/accounts' }}
          />
        ) : (
          <>
            {/* Selector de cuenta */}
            <div className="glass rounded-2xl p-4 flex items-center gap-4 flex-wrap">
              <span className="text-white/40 text-sm">Cuenta:</span>
              <div className="flex gap-2 flex-wrap">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc.accountNumber)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      selectedAccount === acc.accountNumber
                        ? "gradient-blue text-white"
                        : "glass text-white/50 hover:text-white"
                    }`}
                  >
                    {acc.type} ...{acc.accountNumber.slice(-4)}
                  </button>
                ))}
              </div>
              {selectedAccountData && (
                <span className="ml-auto text-white font-semibold text-sm">
                  {formatCurrency(selectedAccountData.balance)}
                </span>
              )}
            </div>

            {/* Formularios */}
            {(showDepositForm || showWithdrawForm) && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-white font-medium mb-4">
                  {showDepositForm ? "Realizar depósito" : "Realizar retiro"}
                </h2>
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {success}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/40 mb-1.5">
                      Monto
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) =>
                          setForm({ ...form, amount: e.target.value })
                        }
                        className="w-full glass rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/40 mb-1.5">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full glass rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="Concepto"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleOperation(showDepositForm ? "deposit" : "withdraw")
                      }
                      disabled={sending || !form.amount}
                      className={`px-5 py-2.5 rounded-xl text-white text-sm transition-all disabled:opacity-50 ${
                        showDepositForm ? "gradient-green" : "gradient-amber"
                      }`}
                    >
                      {sending
                        ? "Procesando..."
                        : showDepositForm
                          ? "Depositar"
                          : "Retirar"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDepositForm(false);
                        setShowWithdrawForm(false);
                      }}
                      className="px-5 py-2.5 rounded-xl text-white/40 hover:text-white text-sm glass transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Historial */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-white font-medium">Historial de movimientos</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !data || data.content.length === 0 ? (
                <div className="p-12 text-center text-white/30 text-sm">
                  No hay movimientos
                </div>
              ) : (
                <>
                  {data.content.map((tx, i) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between px-6 py-4 ${
                        i < data.content.length - 1 ? "border-b border-white/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[tx.type]}`}
                        >
                          {typeIcons[tx.type]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {tx.description || tx.type}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-semibold">
                          {formatCurrency(tx.amount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === "COMPLETADA"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Paginación */}
                  <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-white/30 text-xs">
                      {data.totalElements} movimiento
                      {data.totalElements !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchHistory(selectedAccount, page - 1)}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded-lg glass text-white/40 hover:text-white text-xs disabled:opacity-30 transition-all"
                      >
                        ← Anterior
                      </button>
                      <span className="px-3 py-1.5 text-white/40 text-xs">
                        {page + 1} / {data.totalPages}
                      </span>
                      <button
                        onClick={() => fetchHistory(selectedAccount, page + 1)}
                        disabled={data.last}
                        className="px-3 py-1.5 rounded-lg glass text-white/40 hover:text-white text-xs disabled:opacity-30 transition-all"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}