/**
 * AutoTracker — Update Service v2
 *
 * Система обновлений:
 * - Проверка через GitHub Releases API
 * - Скачивание APK в приложении с прогресс-баром
 * - Установка через нативный Capacitor плагин (кнопка «Установить»)
 * - Fallback: открытие браузера для PWA/веб-версии
 *
 * Поток: Проверка → Скачивание → Кнопка «Установить» → Системный установщик
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
  speed: string
  error?: string
}

// Текущая версия приложения (должна совпадать с тегом релиза на GitHub)
export const CURRENT_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: 1,
  releaseChannel: 'stable',
}

const GITHUB_REPO = 'redbleach5/autotracker'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 часа

// Храним путь к скачанному APK (для повторной установки без повторного скачивания)
let cachedApkPath: string | null = null

/**
 * Сравнивает две semver версии.
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

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} МБ`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} КБ`
  return `${bytes} Б`
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} МБ/с`
  if (bytesPerSec >= 1_000) return `${(bytesPerSec / 1_000).toFixed(0)} КБ/с`
  return `${Math.round(bytesPerSec)} Б/с`
}

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
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform())
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
      throw new Error(`GitHub API: ${response.status}`)
    }

    const releases: any[] = await response.json()

    if (!releases || releases.length === 0) {
      return { hasUpdate: false, current: CURRENT_VERSION.version, latest: CURRENT_VERSION.version, checkedAt }
    }

    const latestRelease = releases.find((r: any) => !r.prerelease) || releases[0]
    const latestVersion = latestRelease.tag_name.replace(/^v/, '')

    const apkAsset = latestRelease.assets?.find((a: any) =>
      a.name.endsWith('.apk') && a.name.toLowerCase().includes('debug')
    ) || latestRelease.assets?.find((a: any) => a.name.endsWith('.apk'))

    const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION.version) > 0

    if (!hasUpdate) {
      return { hasUpdate: false, current: CURRENT_VERSION.version, latest: latestVersion, checkedAt }
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

    return { hasUpdate: true, current: CURRENT_VERSION.version, latest: latestVersion, release, checkedAt }
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
 * Скачивание APK с прогрессом через fetch + ReadableStream.
 * В нативном режиме — сохраняет в кэш через Capacitor Filesystem.
 * В веб-режиме — скачивает файл через браузер.
 *
 * Возвращает путь к файлу (нативный) или 'browser_download' (веб).
 */
export async function downloadApk(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
): Promise<string> {
  onProgress({
    state: 'downloading',
    bytesLoaded: 0,
    bytesTotal: 0,
    percent: 0,
    speed: '',
  })

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0')
    const startTime = Date.now()

    if (!response.body) {
      // Fallback: нет ReadableStream (старые браузеры) — используем XHR
      return await downloadViaXhr(url, onProgress)
    }

    // Читаем поток с прогрессом
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let bytesLoaded = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      bytesLoaded += value.length

      const elapsed = (Date.now() - startTime) / 1000
      const speed = elapsed > 0 ? bytesLoaded / elapsed : 0

      onProgress({
        state: 'downloading',
        bytesLoaded,
        bytesTotal: contentLength,
        percent: contentLength > 0 ? Math.round((bytesLoaded / contentLength) * 100) : 0,
        speed: formatSpeed(speed),
      })
    }

    // Собираем Blob из чанков
    const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' })

    onProgress({
      state: 'downloaded',
      bytesLoaded: blob.size,
      bytesTotal: blob.size,
      percent: 100,
      speed: '',
    })

    // Сохраняем файл
    if (isNativePlatform()) {
      const filePath = await saveApkToCache(blob)
      cachedApkPath = filePath
      return filePath
    } else {
      // Веб-режим: скачиваем через браузер
      triggerBrowserDownload(blob)
      return 'browser_download'
    }
  } catch (error) {
    onProgress({
      state: 'error',
      bytesLoaded: 0,
      bytesTotal: 0,
      percent: 0,
      speed: '',
      error: error instanceof Error ? error.message : 'Ошибка скачивания',
    })
    throw error
  }
}

/**
 * Fallback скачивание через XHR (для старых WebView без ReadableStream)
 */
function downloadViaXhr(
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
        const elapsed = (Date.now() - startTime) / 1000
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

        if (isNativePlatform()) {
          try {
            const filePath = await saveApkToCache(blob)
            cachedApkPath = filePath
            resolve(filePath)
          } catch (error) {
            reject(error)
          }
        } else {
          triggerBrowserDownload(blob)
          resolve('browser_download')
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Ошибка сети')))
    xhr.addEventListener('abort', () => reject(new Error('Отменено')))

    xhr.send()
  })
}

/**
 * Скачивание файла через браузер (создаёт ссылку и кликает по ней)
 */
function triggerBrowserDownload(blob: Blob) {
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = 'AutoTracker.apk'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

/**
 * Сохраняет APK в кэш приложения через Capacitor Filesystem.
 * Использует динамический импорт для совместимости с SSR.
 */
async function saveApkToCache(blob: Blob): Promise<string> {
  // Динамический импорт — не ломает SSR
  const { Filesystem, Directory } = await import('@capacitor/filesystem')

  const base64 = await blobToBase64(blob)

  const result = await Filesystem.writeFile({
    path: 'updates/AutoTracker.apk',
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  return result.uri || ''
}

/**
 * Конвертирует Blob в base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Устанавливает APK через нативный Capacitor плагин.
 * Вызывается ПОСЛЕ скачивания, по нажатию кнопки «Установить».
 */
export async function installApk(filePath?: string): Promise<boolean> {
  const path = filePath || cachedApkPath

  // В веб-режиме — открываем страницу релизов
  if (!isNativePlatform()) {
    window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank', 'noopener,noreferrer')
    return true
  }

  if (!path) {
    throw new Error('APK файл не найден. Скачайте обновление повторно.')
  }

  // Динамический импорт Capacitor core
  const { registerPlugin } = await import('@capacitor/core')

  const ApkInstaller = registerPlugin<{
    canRequestInstall(): Promise<{ canRequest: boolean }>
    requestInstallPermission(): Promise<{ granted: boolean }>
    installApk(options: { filePath: string }): Promise<{ success: boolean }>
  }>('ApkInstaller')

  // Проверяем разрешение на установку (Android 8+)
  try {
    const { canRequest } = await ApkInstaller.canRequestInstall()

    if (!canRequest) {
      const { granted } = await ApkInstaller.requestInstallPermission()
      if (!granted) {
        throw new Error('INSTALL_PERMISSION_REQUIRED')
      }
    }
  } catch (error: any) {
    if (error?.message === 'INSTALL_PERMISSION_REQUIRED') {
      throw error
    }
    // Если canRequestInstall не работает — пробуем установить напрямую
  }

  // Запускаем установку
  const result = await ApkInstaller.installApk({ filePath: path })
  return result.success === true
}

/**
 * Получить URL для скачивания APK
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
 * Форматирует размер файла
 */
export function formatBytes(bytes: number): string {
  return formatFileSize(bytes)
}

/**
 * Получить закэшированный путь к APK (для повторной установки)
 */
export function getCachedApkPath(): string | null {
  return cachedApkPath
}

/**
 * Очистить кэш APK
 */
export function clearApkCache(): void {
  cachedApkPath = null
}
