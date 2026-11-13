import Link from 'next/link'
import { LogoMark } from '@/components/shared/logo'

export function AuthPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden bg-primary bg-cover bg-center"
      style={{ backgroundImage: "url('/auth-hero.jpg')" }}
    >
      {/* Flat charcoal scrim so the white text stays readable */}
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-[#353335]/75" />

      <Link href="/" className="relative flex items-center gap-3">
        <LogoMark white className="h-8 w-auto" />
        <span className="font-display text-xl text-white">Assessly</span>
      </Link>

      <div className="relative max-w-lg">{children}</div>

      <p className="relative text-white/60 text-xs">
        © {new Date().getFullYear()} Assessly. All rights reserved.
      </p>
    </div>
  )
}
