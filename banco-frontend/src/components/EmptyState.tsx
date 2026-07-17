import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    to: string
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-white font-medium mb-2">{title}</p>
      <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        <button
          onClick={() => navigate(action.to)}
          className="gradient-blue glow-blue text-white text-sm px-5 py-2.5 rounded-xl transition-all">
          {action.label}
        </button>
      )}
    </div>
  )
}