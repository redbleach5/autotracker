'use client'

import { useAppStore } from '@/components/app-store'
import {
  getDownloadUrl,
  formatReleaseDate,
  formatBytes,
  CURRENT_VERSION,
  downloadApk,
  installApk,
  isNativePlatform,
  getCachedApkPath,
  clearApkCache,
  type ReleaseInfo,
  type DownloadProgress,
} from '@/lib/update-service'
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
  Clock,
  HardDrive,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Wifi,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback, useRef } from 'react'

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

function DownloadProgressBar({ progress }: { progress: DownloadProgress }) {
  const percent = progress.percent
  const isIndeterminate = progress.bytesTotal === 0 && progress.state === 'downloading'

  return (
    <div className="space-y-2.5">
      <div className="relative h-3 bg-muted/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
          style={{
            width: isIndeterminate ? '30%' : `${percent}%`,
            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
            ...(isIndeterminate ? { animation: 'indeterminate 1.5s ease-in-out infinite' } : {}),
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: isIndeterminate ? '30%' : `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {progress.bytesTotal > 0 && (
            <span>
              {formatBytes(progress.bytesLoaded)} / {formatBytes(progress.bytesTotal)}
            </span>
          )}
          {progress.speed && (
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              {progress.speed}
            </span>
          )}
        </div>
        {!isIndeterminate && percent > 0 && (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{percent}%</span>
        )}
      </div>
    </div>
  )
}

/**
 * Диалог обновления.
 *
 * Поток: «Обновить» → скачивание с прогрессом → «Установить» → системный установщик
 */
export function UpdateDialog() {
  const {
    updateDialogOpen,
    setUpdateDialogOpen,
    updateInfo,
    dismissUpdate,
    downloadProgress,
    downloadState,
    setDownloadProgress,
    setDownloadState,
    resetDownloadState,
  } = useAppStore()

  const [installError, setInstallError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const downloadedFilePath = useRef<string | null>(null)

  const isDownloading = downloadState === 'downloading'
  const isDownloaded = downloadState === 'downloaded'
  const isInstalling = downloadState === 'installing'
  const isError = downloadState === 'error'
  const isBusy = isDownloading || isInstalling

  // Шаг 1: Скачивание APK
  const handleDownload = useCallback(async () => {
    if (!updateInfo) return

    setDownloadError(null)
    setInstallError(null)
    setDownloadState('downloading')

    try {
      const url = getDownloadUrl(updateInfo)
      const filePath = await downloadApk(url, (progress) => {
        setDownloadProgress(progress)

        if (progress.state === 'downloaded') {
          setDownloadState('downloaded')
        } else if (progress.state === 'error') {
          setDownloadState('error')
          setDownloadError(progress.error || 'Ошибка скачивания')
        }
      })

      downloadedFilePath.current = filePath
    } catch (error: any) {
      setDownloadState('error')
      setDownloadError(error?.message || 'Ошибка при скачивании')
    }
  }, [updateInfo, setDownloadProgress, setDownloadState])

  // Шаг 2: Установка APK
  const handleInstall = useCallback(async () => {
    setInstallError(null)
    setDownloadState('installing')

    try {
      const filePath = downloadedFilePath.current || getCachedApkPath() || undefined
      await installApk(filePath)
      // Если installApk завершился без ошибки, значит системный установщик запущен
      // Возвращаемся в состояние «скачано» на случай, если пользователь вернётся
      setDownloadState('downloaded')
    } catch (error: any) {
      if (error?.message === 'INSTALL_PERMISSION_REQUIRED') {
        setInstallError('Необходимо разрешить установку из неизвестных источников. Нажмите «Установить» ещё раз и разрешите в настройках.')
      } else {
        setInstallError(error?.message || 'Не удалось запустить установку')
      }
      setDownloadState('downloaded') // Возвращаем к «скачано» чтобы можно было повторить
    }
  }, [setDownloadState])

  // Повторная попытка
  const handleRetry = useCallback(() => {
    resetDownloadState()
    setDownloadError(null)
    setInstallError(null)
    downloadedFilePath.current = null
    clearApkCache()
  }, [resetDownloadState])

  // Закрыть / Позже
  const handleClose = useCallback(() => {
    if (isBusy) return
    resetDownloadState()
    setDownloadError(null)
    setInstallError(null)
    downloadedFilePath.current = null
    setUpdateDialogOpen(false)
  }, [isBusy, resetDownloadState, setUpdateDialogOpen])

  const handleLater = useCallback(() => {
    if (!isBusy) {
      dismissUpdate()
    }
  }, [isBusy, dismissUpdate])

  if (!updateInfo) return null

  return (
    <Dialog open={updateDialogOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
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
            <span className="text-muted-foreground">Текущая:</span>
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
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 shrink-0 mt-0.5">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical warning */}
          {updateInfo.isCritical && !isError && (
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

          {/* Скачивание — прогресс */}
          {isDownloading && downloadProgress && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Скачивание обновления...</span>
              </div>
              <DownloadProgressBar progress={downloadProgress} />
            </div>
          )}

          {/* Скачано — готово к установке */}
          {isDownloaded && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {isNativePlatform() ? 'Скачивание завершено!' : 'Файл скачан'}
                </span>
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                {isNativePlatform()
                  ? 'Нажмите «Установить» для запуска обновления'
                  : 'Найдите скачанный файл в папке загрузок и установите его'}
              </p>
            </div>
          )}

          {/* Установка */}
          {isInstalling && (
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Запуск установки...</span>
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                Подтвердите установку в системном диалоге Android
              </p>
            </div>
          )}

          {/* Ошибка скачивания */}
          {isError && downloadError && (
            <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{downloadError}</p>
                  <button
                    className="text-xs text-red-600/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-300 mt-1 flex items-center gap-1 transition-colors"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Попробовать ещё раз
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ошибка установки */}
          {installError && !isError && (
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{installError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Подсказка о разрешениях */}
          {isNativePlatform() && !isBusy && !isError && !installError && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                При первом обновлении может потребоваться разрешить установку из неизвестных источников в настройках Android
              </p>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-1 pb-2">
            {/* Кнопка «Позже» — не показываем при критическом обновлении и скачивании */}
            {!updateInfo.isCritical && !isBusy && !isDownloaded && (
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleLater}>
                Позже
              </Button>
            )}

            {/* Основная кнопка — зависит от текущего состояния */}
            {isError ? (
              <Button className="flex-1 h-11 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
            ) : isDownloading ? (
              <Button className="flex-1 h-11 shadow-sm bg-emerald-600 text-white opacity-80" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Скачивание {downloadProgress?.percent ?? 0}%
              </Button>
            ) : isInstalling ? (
              <Button className="flex-1 h-11 shadow-sm bg-blue-600 text-white opacity-80" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Установка...
              </Button>
            ) : isDownloaded ? (
              <Button
                className="flex-1 h-11 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/40 dark:shadow-emerald-900/30"
                onClick={handleInstall}
              >
                <Download className="h-4 w-4 mr-2" />
                {isNativePlatform() ? 'Установить' : 'Скачать APK'}
              </Button>
            ) : (
              <Button
                className={`flex-1 h-11 shadow-sm ${
                  updateInfo.isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200/40 dark:shadow-red-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/40 dark:shadow-emerald-900/30'
                }`}
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Обновить до v{updateInfo.version}
              </Button>
            )}
          </div>

          {/* Ссылка на GitHub */}
          {!isBusy && (
            <button
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => window.open(`https://github.com/redbleach5/autotracker/releases`, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-3 w-3" />
              Открыть страницу релизов на GitHub
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
