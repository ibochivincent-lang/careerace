'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PracticeRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/interview_room')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-xs text-muted-foreground font-mono">Redirecting to STAR+R Interview Room...</p>
    </div>
  )
}
