export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border/50 py-2 px-6">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Assessly. All rights reserved.</span>
        <span className="font-mono">v0.1.0</span>
      </div>
    </footer>
  )
}
