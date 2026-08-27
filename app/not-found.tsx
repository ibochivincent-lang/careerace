'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Brain, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Big 404 */}
      <div className="relative mb-8">
        <p className="text-[120px] font-black text-muted-foreground/15 leading-none select-none">404</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-16 h-16 text-black dark:text-white" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
        This page doesn&apos;t exist. But your study session is still waiting.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Go back
        </Button>
        <Button onClick={() => router.push('/dashboard')}>
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
      </div>
    </div>
  )
}
