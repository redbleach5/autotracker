'use client'

import { useAppStore } from '@/components/app-store'
import { Download, X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatBytes } from '@/lib/update-service'

/**
 * Компактный баннер обновления с прогресс-баром скачивания.
 */
export function UpdateBanner() {
  const { updateAvailable, updateDismissed, updateInfo, downloadState, downloadProgress, setUpdateDialogOpen, dismissUpdate } = useAppStore()

  const isVisible = updateAvailable && !updateDismissed && updateInfo
  const isDownloading = downloadState === 'downloading'
  const isInstalling = downloadState === 'installing'
  const isDownloaded = downloadState === 'downloaded'
  const isBusy = isDownloading || isInstalling

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
            className={`mx-4 mt-2 rounded-xl p-3 cursor-pointer ${
              isBusy
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm shadow-blue-200/40 dark:shadow-blue-900/30'
                : isDownloaded
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30'
                : updateInfo.isCritical
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm shadow-red-200/40 dark:shadow-red-900/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30'
            }`}
            onClick={() => setUpdateDialogOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 shrink-0">
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDownloaded ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : updateInfo.isCritical ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isDownloading && downloadProgress ? (
                  <>
                    <p className="text-sm font-semibold">Скачивание... {downloadProgress.percent}%</p>
                    <div className="mt-1.5 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/80 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress.percent}%` }}
                      />
                    </div>
                  </>
                ) : isInstalling ? (
                  <p className="text-sm font-semibold">Установка обновления...</p>
                ) : isDownloaded ? (
                  <p className="text-sm font-semibold">Готово к установке — v{updateInfo.version}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold">
                      {updateInfo.isCritical ? 'Критическое обновление' : 'Доступно обновление'}
                    </p>
                    <p className="text-xs opacity-80 truncate">
                      v{updateInfo.version}{updateInfo.apkSize ? ` — ${updateInfo.apkSize}` : ''}
                    </p>
                  </>
                )}
              </div>

              {!isBusy && (
                <button
                  className="shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    dismissUpdate()
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
