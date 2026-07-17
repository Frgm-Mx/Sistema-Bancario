import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState"; // Importación del componente EmptyState
import api from "../api/axios";

interface CreditScoreData {
  score: number;
  rating: string;
  totalTransactions: number;
  failedTransactions: number;
  averageBalance: number;
  monthsActive: number;
  updatedAt: string;
}

const ratingConfig = {
  EXCELENTE: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    glow: "glow-green",
    gradient: "gradient-green",
    label: "Excelente",
    limit: "$50,000",
  },
  BUENO: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "glow-blue",
    gradient: "gradient-blue",
    label: "Bueno",
    limit: "$25,000",
  },
  REGULAR: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "",
    gradient: "gradient-amber",
    label: "Regular",
    limit: "$10,000",
  },
  MALO: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "",
    gradient: "",
    label: "Malo",
    limit: "$3,000",
  },
};

export default function CreditScore() {
  const [data, setData] = useState<CreditScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const accs = await api.get("/accounts");
        if (accs.data.length === 0) {
          setHasAccounts(false);
          setLoading(false);
          return;
        }
        const { data } = await api.get<CreditScoreData>("/credit-score");
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!hasAccounts) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">Score crediticio</h1>
            <p className="text-white/40 text-sm mt-1">Tu reputación financiera con el banco</p>
          </div>
          <EmptyState
            icon={<svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            title="Tu score se construye con el tiempo"
            description="Para calcular tu score crediticio necesitas tener al menos una cuenta activa y realizar movimientos. Empieza abriendo tu primera cuenta."
            action={{ label: 'Abrir mi primera cuenta', to: '/accounts' }}
          />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-white/40">Error al cargar el score</p>
      </Layout>
    );
  }

  const config =
    ratingConfig[data.rating as keyof typeof ratingConfig] || ratingConfig.MALO;
  const scorePercent = ((data.score - 300) / (850 - 300)) * 100;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Score crediticio
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Tu reputación financiera con el banco
          </p>
        </div>

        {/* Score principal */}
        <div className={`glass rounded-2xl p-8 border ${config.border}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Tu score actual</p>
              <p className="text-6xl font-bold text-white">{data.score}</p>
              <p className="text-white/30 text-sm mt-1">de 850 posibles</p>
            </div>
            <div className={`text-right`}>
              <span className={`text-2xl font-bold ${config.color}`}>
                {config.label}
              </span>
              <p className="text-white/40 text-sm mt-1">
                Límite de crédito disponible
              </p>
              <p className={`text-xl font-semibold ${config.color}`}>
                {config.limit}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${config.gradient || "bg-red-500"}`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/20">
              <span>300 — Malo</span>
              <span>580 — Regular</span>
              <span>670 — Bueno</span>
              <span>740 — Excelente</span>
            </div>
          </div>
        </div>

        {/* Factores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">Meses activo</p>
            <p className="text-3xl font-bold text-white">{data.monthsActive}</p>
            <p className="text-white/30 text-xs mt-1">
              Antigüedad con el banco
            </p>
            <div className="mt-3 h-1 bg-white/5 rounded-full">
              <div
                className="h-full gradient-blue rounded-full"
                style={{ width: `${Math.min(data.monthsActive * 3, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">Saldo promedio</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(data.averageBalance)}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Entre todas tus cuentas
            </p>
            <div className="mt-3 h-1 bg-white/5 rounded-full">
              <div
                className="h-full gradient-green rounded-full"
                style={{
                  width: `${Math.min((data.averageBalance / 50000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">Transacciones exitosas</p>
            <p className="text-3xl font-bold text-white">
              {data.totalTransactions - data.failedTransactions}
            </p>
            <p className="text-white/30 text-xs mt-1">
              de {data.totalTransactions} totales
            </p>
            <div className="mt-3 h-1 bg-white/5 rounded-full">
              <div
                className="h-full gradient-blue rounded-full"
                style={{
                  width:
                    data.totalTransactions > 0
                      ? `${((data.totalTransactions - data.failedTransactions) / data.totalTransactions) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">Transacciones fallidas</p>
            <p className="text-3xl font-bold text-red-400">
              {data.failedTransactions}
            </p>
            <p className="text-white/30 text-xs mt-1">Penalizan tu score</p>
            <div className="mt-3 h-1 bg-white/5 rounded-full">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{
                  width:
                    data.totalTransactions > 0
                      ? `${(data.failedTransactions / data.totalTransactions) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Cómo mejorar */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-white font-medium mb-4">Cómo mejorar tu score</h2>
          <div className="space-y-3">
            {[
              {
                text: "Mantén un saldo promedio mayor a $5,000",
                done: data.averageBalance >= 5000,
              },
              {
                text: "Realiza transferencias exitosas frecuentemente",
                done: data.totalTransactions - data.failedTransactions >= 10,
              },
              {
                text: "Evita transacciones fallidas por saldo insuficiente",
                done: data.failedTransactions === 0,
              },
              {
                text: "Mantén tus cuentas activas por más de 6 meses",
                done: data.monthsActive >= 6,
              },
              {
                text: "Alcanza un saldo promedio mayor a $20,000 para score excelente",
                done: data.averageBalance >= 20000,
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? "bg-green-500/20" : "bg-white/5"
                  }`}
                >
                  {item.done ? (
                    <svg
                      className="w-3 h-3 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </div>
                <p
                  className={`text-sm ${item.done ? "text-white/60 line-through" : "text-white/80"}`}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}