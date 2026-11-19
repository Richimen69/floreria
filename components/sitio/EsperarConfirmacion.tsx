'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function EsperarConfirmacion() {
  const router = useRouter()

  useEffect(() => {
    const intervalo = setInterval(() => router.refresh(), 3000)
    const limite = setTimeout(() => clearInterval(intervalo), 2 * 60_000)
    return () => {
      clearInterval(intervalo)
      clearTimeout(limite)
    }
  }, [router])

  return null
}