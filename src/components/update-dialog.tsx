'use client'

import { useAppStore } from '@/components/app-store'
import { getDownloadUrl, formatReleaseDate, CURRENT_VERSION, type ReleaseInfo } from '@/lib/update-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Clock,
  HardDrive,
  ChevronRight,
} from 'lucide-react'
import Image from 'next/image'

function VersionBadge({ version, isCritical }: { version: string; isCritical: boolean }) {
  return (
    <Badge
      className={`text-xs font-semibold ${
        isCritical
          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      }`}
    >
      v{version}
    </Badge>
  )
}

/**
 * Полноценный диалог обновления с чейнджлогом.
 * Открывается как bottom-sheet при нажатии на баннер
 * или на иконку обновления в хедере.
 */
export function UpdateDialog() {
  const { updateDialogOpen, setUpdateDialogOpen, updateInfo, dismissUpdate } = useAppStore()

  if (!updateInfo) return null

  const handleDownload = () => {
    const url = getDownloadUrl(updateInfo)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleLater = () => {
    dismissUpdate()
  }

  return (
    <Dialog open={updateDialogOpen} onOpenChange={(open) => { if (!open) setUpdateDialogOpen(false) }}>
      <DialogContent className="bottom-sheet-content max-w-md">
        <div className="bottom-sheet-handle" />
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5">
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${
              updateInfo.isCritical
                ? 'bg-red-50 dark:bg-red-950/50'
                : 'bg-emerald-50 dark:bg-emerald-950/50'
            }`}>
              {updateInfo.isCritical ? (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            {updateInfo.isCritical ? 'Критическое обновление' : 'Новое обновление'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          {/* Version header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
              <Image src="/logo-icon.png" alt="AT" width={36} height={36} className="rounded-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{updateInfo.title}</span>
                <VersionBadge version={updateInfo.version} isCritical={updateInfo.isCritical} />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatReleaseDate(updateInfo.publishedAt)}
                </div>
                {updateInfo.apkSize && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HardDrive className="h-3 w-3" />
                    {updateInfo.apkSize}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Version comparison */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Текущая версия:</span>
            <Badge variant="outline" className="text-[10px] font-mono">v{CURRENT_VERSION.version}</Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <Badge className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              v{updateInfo.version}
            </Badge>
          </div>

          {/* Changelog */}
          {updateInfo.changelog.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Что нового</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {updateInfo.changelog.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 shrink-0 mt-0.5">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {idx + 1}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical warning */}
          {updateInfo.isCritical && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Критическое обновление</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                  Эта версия содержит важные исправления безопасности и стабильности. Рекомендуем обновить приложение как можно скорее.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 pb-2">
            {!updateInfo.isCritical && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={handleLater}
              >
                Позже
              </Button>
            )}
            <Button
              className={`flex-1 h-11 shadow-sm ${
                updateInfo.isCritical
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200/40 dark:shadow-red-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/40 dark:shadow-emerald-900/30'
              }`}
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Скачать v{updateInfo.version}
            </Button>
          </div>

          {/* GitHub link */}
          <button
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => window.open(`https://github.com/redbleach5/autotracker/releases`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-3 w-3" />
            Открыть страницу релизов на GitHub
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
