'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useDbQuery<T>(queryFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await queryFnRef.current()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
