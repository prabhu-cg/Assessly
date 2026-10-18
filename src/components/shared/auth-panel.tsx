import Link from 'next/link'
import { LogoMark } from '@/components/shared/logo'

export function AuthPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden bg-primary bg-cover bg-center"
      style={{ backgroundImage: "url('/auth-hero.jpg')" }}
    >
      {/* Terracotta tint, then a dark scrim so the white text stays readable */}
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-primary/60 mix-blend-multiply" />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgb(28 25 23 / 0.55), rgb(28 25 23 / 0.3) 45%, rgb(28 25 23 / 0.8))',
        }}
      />

      <Link href="/" className="relative flex items-center gap-3">
        <LogoMark white className="h-8 w-auto" />
        <span className="text-white text-xl font-bold tracking-tight">Assessly</span>
      </Link>

      <div className="relative max-w-lg">{children}</div>

      <p className="relative text-white/60 text-xs">
        © {new Date().getFullYear()} Assessly. All rights reserved.
      </p>
    </div>
  )
}
