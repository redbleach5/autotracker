/**
 * AutoTracker — Update Service
 *
 * Полноценная система обновлений:
 * - Проверка через GitHub Releases API
 * - Скачивание APK прямо в приложении с прогресс-баром
 * - Автоматическая установка через нативный Capacitor плагин
 * - Fallback на открытие браузера для PWA/веб-версии
 */

export interface AppVersion {
  version: string
  buildNumber: number
  releaseChannel: string
}

export interface ReleaseInfo {
  version: string
  buildNumber: number
  title: string
  changelog: string[]
  downloadUrl: string
  apkSize: string
  apkSizeBytes: number
  publishedAt: string
  isCritical: boolean
}

export interface UpdateCheckResult {
  hasUpdate: boolean
  current: string
  latest: string
  release?: ReleaseInfo
  checkedAt: string
  error?: string
}

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'installing' | 'error'

export interface DownloadProgress {
  state: DownloadState
  bytesLoaded: number
  bytesTotal: number
  percent: number
  speed: string // e.g., "2.3 МБ/с"
  error?: string
}

// Текущая версия приложения
export const CURRENT_VERSION: AppVersion = {
  version: '1.1.0',
  buildNumber: 2,
  releaseChannel: 'stable',
}

const GITHUB_REPO = 'redbleach5/autotracker'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 часа

/**
 * Сравнивает две semver версии.
 * Возвращает: 1 если a > b, -1 если a < b, 0 если равны
 */
export function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const clean = v.replace(/^v/, '').replace(/-.*$/, '')
    return clean.split('.').map(Number)
  }

  const partsA = parseVersion(a)
  const partsB = parseVersion(b)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] ?? 0
    const numB = partsB[i] ?? 0
    if (numA > numB) return 1
    if (numA < numB) return -1
  }
  return 0
}

/**
 * Парсит changelog из тела GitHub Release
 */
function parseChangelog(body: string): string[] {
  if (!body) return []
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* '))
    .map(line => line.replace(/^[-•*]\s*/, ''))
    .filter(Boolean)
    .slice(0, 15)
}

/**
 * Определяет размер APK в человекочитаемом формате
 */
function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} МБ`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} КБ`
  return `${bytes} Б`
}

/**
 * Форматирует скорость скачивания
 */
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} МБ/с`
  if (bytesPerSec >= 1_000) return `${(bytesPerSec / 1_000).toFixed(0)} КБ/с`
  return `${bytesPerSec} Б/с`
}

/**
 * Проверяет, нужно ли выполнять проверку обновлений
 */
export function shouldCheckForUpdate(lastCheckedAt: string | null): boolean {
  if (!lastCheckedAt) return true
  const lastChecked = new Date(lastCheckedAt).getTime()
  const now = Date.now()
  return (now - lastChecked) >= CHECK_INTERVAL_MS
}

/**
 * Проверяем, запущено ли приложение в Capacitor (нативный Android)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/**
 * Основная функция проверки обновлений через GitHub Releases API
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const checkedAt = new Date().toISOString()

  try {
    const response = await fetch(`${GITHUB_API}?per_page=5`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`GitHub API вернул ${response.status}`)
    }

    const releases: any[] = await response.json()

    if (!releases || releases.length === 0) {
      return {
        hasUpdate: false,
        current: CURRENT_VERSION.version,
        latest: CURRENT_VERSION.version,
        checkedAt,
      }
    }

    const latestRelease = releases.find((r: any) => !r.prerelease) || releases[0]
    const latestVersion = latestRelease.tag_name.replace(/^v/, '')

    const apkAsset = latestRelease.assets?.find((a: any) =>
      a.name.endsWith('.apk') && a.name.toLowerCase().includes('debug')
    ) || latestRelease.assets?.find((a: any) => a.name.endsWith('.apk'))

    const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION.version) > 0

    if (!hasUpdate) {
      return {
        hasUpdate: false,
        current: CURRENT_VERSION.version,
        latest: latestVersion,
        checkedAt,
      }
    }

    const currentMajor = parseInt(CURRENT_VERSION.version.split('.')[0])
    const latestMajor = parseInt(latestVersion.split('.')[0])
    const isCritical = latestMajor > currentMajor

    const release: ReleaseInfo = {
      version: latestVersion,
      buildNumber: parseInt(latestRelease.id?.toString() || '0'),
      title: latestRelease.name || `v${latestVersion}`,
      changelog: parseChangelog(latestRelease.body || ''),
      downloadUrl: apkAsset?.browser_download_url || latestRelease.html_url,
      apkSize: apkAsset ? formatFileSize(apkAsset.size) : '',
      apkSizeBytes: apkAsset?.size || 0,
      publishedAt: latestRelease.published_at,
      isCritical,
    }

    return {
      hasUpdate: true,
      current: CURRENT_VERSION.version,
      latest: latestVersion,
      release,
      checkedAt,
    }
  } catch (error) {
    console.error('Ошибка проверки обновлений:', error)
    return {
      hasUpdate: false,
      current: CURRENT_VERSION.version,
      latest: CURRENT_VERSION.version,
      checkedAt,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Скачивание APK с прогрессом через XMLHttpRequest.
 * Работает и в нативном, и в веб-режиме (для веба — сохраняет в Downloads).
 */
export function downloadApkWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'

    const startTime = Date.now()

    xhr.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const elapsed = (Date.now() - startTime) / 1000 // секунды
        const speed = elapsed > 0 ? event.loaded / elapsed : 0

        onProgress({
          state: 'downloading',
          bytesLoaded: event.loaded,
          bytesTotal: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
          speed: formatSpeed(speed),
        })
      }
    })

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob: Blob = xhr.response

        onProgress({
          state: 'downloaded',
          bytesLoaded: blob.size,
          bytesTotal: blob.size,
          percent: 100,
          speed: '',
        })

        try {
          // Если Capacitor — сохраняем в кэш приложения и устанавливаем
          if (isNativePlatform()) {
            const filePath = await saveApkToCache(blob)
            resolve(filePath)
          } else {
            // Для веб/PWA — запускаем обычное скачивание через браузер
            const downloadUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = 'AutoTracker.apk'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)
            resolve('browser_download')
          }
        } catch (error) {
          onProgress({
            state: 'error',
            bytesLoaded: 0,
            bytesTotal: 0,
            percent: 0,
            speed: '',
            error: error instanceof Error ? error.message : 'Ошибка сохранения файла',
          })
          reject(error)
        }
      } else {
        const error = `HTTP ${xhr.status}`
        onProgress({
          state: 'error',
          bytesLoaded: 0,
          bytesTotal: 0,
          percent: 0,
          speed: '',
          error,
        })
        reject(new Error(error))
      }
    })

    xhr.addEventListener('error', () => {
      onProgress({
        state: 'error',
        bytesLoaded: 0,
        bytesTotal: 0,
        percent: 0,
        speed: '',
        error: 'Ошибка сети при скачивании',
      })
      reject(new Error('Ошибка сети'))
    })

    xhr.addEventListener('abort', () => {
      onProgress({
        state: 'error',
        bytesLoaded: 0,
        bytesTotal: 0,
        percent: 0,
        speed: '',
        error: 'Скачивание отменено',
      })
      reject(new Error('Отменено'))
    })

    xhr.send()
  })
}

/**
 * Сохраняет APK blob в кэш приложения через Capacitor Filesystem API.
 * Возвращает полный путь к файлу для нативной установки.
 */
async function saveApkToCache(blob: Blob): Promise<string> {
  const Capacitor = (window as any).Capacitor
  if (!Capacitor?.Filesystem) {
    throw new Error('Capacitor Filesystem plugin not available')
  }

  const { Filesystem, Directory } = Capacitor.Filesystem

  // Конвертируем Blob в base64
  const base64 = await blobToBase64(blob)

  // Записываем в директорию кэша приложения
  const result = await Filesystem.writeFile({
    path: 'updates/AutoTracker.apk',
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  return result.uri || result.path || ''
}

/**
 * Конвертирует Blob в base64 строку
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Устанавливает APK через нативный Capacitor плагин.
 * В нативном режиме вызывает ApkInstaller.installApk().
 */
export async function installApk(filePath: string): Promise<boolean> {
  if (!isNativePlatform()) {
    // В веб-режиме просто открываем страницу релизов
    window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank', 'noopener,noreferrer')
    return true
  }

  const Capacitor = (window as any).Capacitor
  if (!Capacitor?.ApkInstaller) {
    throw new Error('ApkInstaller plugin not available')
  }

  try {
    // Сначала проверяем, есть ли разрешение на установку
    const canRequest = await Capacitor.ApkInstaller.canRequestInstall()

    if (!canRequest.canRequest) {
      // Запрашиваем разрешение
      const permissionResult = await Capacitor.ApkInstaller.requestInstallPermission()

      if (!permissionResult.granted) {
        throw new Error('INSTALL_PERMISSION_REQUIRED')
      }
    }

    // Устанавливаем APK
    const result = await Capacitor.ApkInstaller.installApk({ filePath })
    return result.success === true
  } catch (error: any) {
    // Если ошибка — разрешение на установку, пробуем фоллбэк
    if (error?.message === 'INSTALL_PERMISSION_REQUIRED' || error?.includes?.('INSTALL_PERMISSION_REQUIRED')) {
      // Пробуем ещё раз запросить разрешение
      try {
        const permissionResult = await Capacitor.ApkInstaller.requestInstallPermission()
        if (permissionResult.granted) {
          const result = await Capacitor.ApkInstaller.installApk({ filePath })
          return result.success === true
        }
      } catch {}
      throw new Error('INSTALL_PERMISSION_REQUIRED')
    }
    throw error
  }
}

/**
 * Полный цикл обновления: скачать → установить
 */
export async function downloadAndInstall(
  downloadUrl: string,
  onProgress: (progress: DownloadProgress) => void,
): Promise<boolean> {
  // Шаг 1: Скачиваем APK
  const filePath = await downloadApkWithProgress(downloadUrl, onProgress)

  // В веб-режиме файл уже скачался через браузер
  if (filePath === 'browser_download') {
    return true
  }

  // Шаг 2: Устанавливаем APK (нативный режим)
  onProgress({
    state: 'installing',
    bytesLoaded: 0,
    bytesTotal: 0,
    percent: 100,
    speed: '',
  })

  return await installApk(filePath)
}

/**
 * Получает URL для скачивания APK
 */
export function getDownloadUrl(release: ReleaseInfo): string {
  return release.downloadUrl || `https://github.com/${GITHUB_REPO}/releases/latest`
}

/**
 * Форматирует дату релиза
 */
export function formatReleaseDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Форматирует размер скачивания
 */
export function formatBytes(bytes: number): string {
  return formatFileSize(bytes)
}
