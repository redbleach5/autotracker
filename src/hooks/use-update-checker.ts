'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/components/app-store'
import { checkForUpdate, shouldCheckForUpdate } from '@/lib/update-service'

/**
 * Хук для автоматической проверки обновлений приложения.
 *
 * - Проверяет при первом запуске
 * - Повторяет проверку каждые 4 часа
 * - Показывает уведомление при наличии обновления
 * - Критические обновления показывают диалог сразу
 * - Не повторяет проверку если пользователь отклонил баннер
 */
export function useUpdateChecker() {
  const {
    updateAvailable,
    updateDismissed,
    lastUpdateCheck,
    downloadState,
    setUpdateAvailable,
    setLastUpdateCheck,
    setUpdateDialogOpen,
  } = useAppStore()

  const isChecking = useRef(false)
  // Используем ref для значений, которые не должны триггерить пересоздание performCheck
  const updateDismissedRef = useRef(updateDismissed)
  const updateAvailableRef = useRef(updateAvailable)
  const lastUpdateCheckRef = useRef(lastUpdateCheck)
  const downloadStateRef = useRef(downloadState)

  // Обновляем refs при каждом рендере
  updateDismissedRef.current = updateDismissed
  updateAvailableRef.current = updateAvailable
  lastUpdateCheckRef.current = lastUpdateCheck
  downloadStateRef.current = downloadState

  const performCheck = useCallback(async (force = false) => {
    if (isChecking.current) return

    // Не проверяем, если сейчас скачивается или устанавливается обновление
    if (downloadStateRef.current === 'downloading' || downloadStateRef.current === 'installing') return

    // Если обновление уже доступно и не отклонено — не проверяем повторно
    if (updateAvailableRef.current && !updateDismissedRef.current && !force) return

    // Проверяем, нужно ли проверять (не чаще раз в 4 часа)
    if (!force && !shouldCheckForUpdate(lastUpdateCheckRef.current)) return

    isChecking.current = true

    try {
      const result = await checkForUpdate()
      setLastUpdateCheck(result.checkedAt)

      if (result.hasUpdate && result.release) {
        setUpdateAvailable(true, result.release)

        // Для критических обновлений показываем диалог сразу
        if (result.release.isCritical) {
          setUpdateDialogOpen(true)
        }
      } else {
        setUpdateAvailable(false, null)
      }
    } catch (error) {
      console.error('Ошибка при проверке обновлений:', error)
    } finally {
      isChecking.current = false
    }
  }, [setUpdateAvailable, setLastUpdateCheck, setUpdateDialogOpen])

  // Проверка при монтировании
  useEffect(() => {
    performCheck()
  }, [performCheck])

  // Периодическая проверка каждые 30 минут
  useEffect(() => {
    const interval = setInterval(() => {
      performCheck()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [performCheck])

  // Проверка при возврате на вкладку
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        performCheck()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [performCheck])

  return { performCheck }
}
