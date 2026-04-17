import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const updateServiceWorkerRef = useRef(() => Promise.resolve())
  const intervalRef = useRef(null)
  const isRegisteredRef = useRef(false)

  useEffect(() => {
    if (isRegisteredRef.current) {
      return undefined
    }

    isRegisteredRef.current = true

    updateServiceWorkerRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) {
          return
        }

        const intervalMs = import.meta.env.DEV ? 10000 : 60 * 60 * 1000
        intervalRef.current = window.setInterval(() => {
          registration.update()
        }, intervalMs)
      },
    })

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: () => updateServiceWorkerRef.current(true),
    dismissPrompt: () => {
      setNeedRefresh(false)
      setOfflineReady(false)
    },
  }
}
