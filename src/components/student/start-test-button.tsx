'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'

interface StartTestButtonProps {
  href: string
  isResume: boolean
}

export function StartTestButton({ href, isResume }: StartTestButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen denied or unavailable — proceed anyway
    }
    router.push(href)
  }

  return (
    <Button size="lg" className="mx-auto flex h-12 w-full gap-2 text-base sm:w-72" onClick={handleStart} disabled={loading}>
      <Maximize2 className="h-4 w-4" />
      {isResume ? 'Continue Test' : 'Start Test'}
    </Button>
  )
}
