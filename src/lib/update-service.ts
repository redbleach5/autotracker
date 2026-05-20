/**
 * AutoTracker — Update Service
 *
 * Проверяет наличие обновлений через GitHub Releases API,
 * сравнивает semver версии и предоставляет информацию об обновлении.
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

// Текущая версия приложения — берётся из version.json при сборке
export const CURRENT_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: 1,
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
    .slice(0, 15) // Ограничиваем длину списка
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
 * Проверяет, нужно ли выполнять проверку обновлений
 * (не чаще раза в CHECK_INTERVAL_MS)
 */
export function shouldCheckForUpdate(lastCheckedAt: string | null): boolean {
  if (!lastCheckedAt) return true
  const lastChecked = new Date(lastCheckedAt).getTime()
  const now = Date.now()
  return (now - lastChecked) >= CHECK_INTERVAL_MS
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
      signal: AbortSignal.timeout(10000), // 10 сек таймаут
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

    // Ищем последний stable-релиз (не pre-release)
    const latestRelease = releases.find((r: any) => !r.prerelease) || releases[0]
    const latestVersion = latestRelease.tag_name.replace(/^v/, '')

    // Ищем APK в ассетах релиза
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

    // Проверяем, является ли обновление критическим (major-версия изменилась)
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
