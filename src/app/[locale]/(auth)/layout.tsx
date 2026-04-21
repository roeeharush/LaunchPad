export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ambient p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.585 0.212 264.4 / 15%), transparent 70%)',
          filter: 'blur(1px)',
        }}
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.58 0.21 291 / 10%), transparent 70%)',
          filter: 'blur(1px)',
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-white font-bold text-lg mb-3"
            style={{ background: 'oklch(0.585 0.212 264.4)' }}
          >
            L
          </div>
          <p className="text-muted-foreground text-sm">לאנצ׳פד</p>
        </div>
        {children}
      </div>
    </div>
  )
}
