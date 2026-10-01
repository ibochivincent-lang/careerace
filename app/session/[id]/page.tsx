'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SessionRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tutor')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-xs text-muted-foreground font-mono">Redirecting to Career Ace AI Coach...</p>
    </div>
  )
}
