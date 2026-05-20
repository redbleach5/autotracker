'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/components/app-store'
import { checkForUpdate, shouldCheckForUpdate } from '@/lib/update-service'

/**
 * Хук для автоматической проверки обновлений приложения.
 *
 * - Проверяет при первом запуске
 * - Повторяет проверку каждые 4 часа
 * - Учитывает отложенные обновления
 * - Показывает уведомление при наличии обновления
 */
export function useUpdateChecker() {
  const {
    updateAvailable,
    updateDismissed,
    lastUpdateCheck,
    setUpdateAvailable,
    setLastUpdateCheck,
    setUpdateDialogOpen,
  } = useAppStore()

  const isChecking = useRef(false)

  const performCheck = useCallback(async (force = false) => {
    if (isChecking.current) return

    // Если обновление уже доступно и не отклонено — не проверяем повторно
    if (updateAvailable && !updateDismissed && !force) return

    // Проверяем, нужно ли проверять (не чаще раз в 4 часа)
    if (!force && !shouldCheckForUpdate(lastUpdateCheck)) return

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
  }, [updateAvailable, updateDismissed, lastUpdateCheck, setUpdateAvailable, setLastUpdateCheck, setUpdateDialogOpen])

  // Проверка при монтировании
  useEffect(() => {
    performCheck()
  }, [performCheck])

  // Периодическая проверка каждые 30 минут (для активной сессии)
  useEffect(() => {
    const interval = setInterval(() => {
      performCheck()
    }, 30 * 60 * 1000) // 30 минут

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
