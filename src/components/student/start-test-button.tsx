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
    <Button size="lg" className="w-full sm:w-auto gap-2" onClick={handleStart} disabled={loading}>
      <Maximize2 className="h-4 w-4" />
      {isResume ? 'Continue Test' : 'Start Test'}
    </Button>
  )
}
