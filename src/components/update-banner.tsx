'use client'

import { useAppStore } from '@/components/app-store'
import { Download, X, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Компактный баннер обновления, отображается под хедером.
 * Показывается только если есть доступное обновление и оно не было отклонено.
 */
export function UpdateBanner() {
  const { updateAvailable, updateDismissed, updateInfo, setUpdateDialogOpen, dismissUpdate } = useAppStore()

  const isVisible = updateAvailable && !updateDismissed && updateInfo

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div
            className={`mx-4 mt-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer card-hover ${
              updateInfo.isCritical
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm shadow-red-200/40 dark:shadow-red-900/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30'
            }`}
            onClick={() => setUpdateDialogOpen(true)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 shrink-0">
              {updateInfo.isCritical ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {updateInfo.isCritical ? 'Критическое обновление' : 'Доступно обновление'}
              </p>
              <p className="text-xs opacity-80 truncate">
                v{updateInfo.version} — нажмите для деталей
              </p>
            </div>

            <button
              className="shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                dismissUpdate()
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
