'use client'

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

const subscribe = () => () => {}

/** Renders children on document.body so `position: fixed` overlays are never trapped by a transformed ancestor (e.g. a lifting card). */
export function Portal({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false)
  return isClient ? createPortal(children, document.body) : null
}
