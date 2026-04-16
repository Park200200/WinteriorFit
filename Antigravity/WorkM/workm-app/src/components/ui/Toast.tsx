import { useToastStore } from '../../stores/toastStore'
import { cn } from '../../utils/cn'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
}

const styles = {
  success: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error:   'border-red-500/30 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info:    'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
              'animate-slideRight',
              styles[toast.type],
            )}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
