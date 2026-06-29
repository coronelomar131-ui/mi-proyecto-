import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4 text-text-tertiary">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-tertiary max-w-xs leading-relaxed mb-5">{description}</p>
      {action && (
        action.href
          ? <Link href={action.href} className="btn-primary btn btn-sm">{action.label}</Link>
          : <button onClick={action.onClick} className="btn-primary btn btn-sm">{action.label}</button>
      )}
    </div>
  )
}
