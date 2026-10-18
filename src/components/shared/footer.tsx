export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border/50 bg-surface">
      <p className="mx-auto max-w-screen-xl px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Assessly. Assess smarter. Teach better.
      </p>
    </footer>
  )
}
