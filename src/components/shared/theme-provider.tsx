'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Light or dark, nothing else. Light is the default; there is no "system" option. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={['light', 'dark']}
      defaultTheme="light"
      enableSystem={false}
      storageKey="assessly-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
