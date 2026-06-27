/**
 * Ambient motion backdrop for the BrandPilot landing page.
 * - Drifting aurora orbs in the Neural Dark palette (purple primary, cyan accent)
 * - A faint neural grid that breathes
 * - Slow-floating "node" particles that hint at brand assets in orbit
 *
 * Pure CSS — no extra deps. Respects prefers-reduced-motion.
 */
export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Breathing neural grid */}
      <div className="absolute inset-0 bg-neural-grid opacity-[0.07] animate-grid-pulse" />

      {/* Aurora orbs */}
      <div className="absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full bg-primary/25 blur-[140px] animate-orb-drift-1" />
      <div className="absolute top-1/3 -right-32 h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[140px] animate-orb-drift-2" />
      <div className="absolute -bottom-40 left-1/3 h-[40rem] w-[40rem] rounded-full bg-primary/15 blur-[160px] animate-orb-drift-3" />

      {/* Floating brand-node particles */}
      <div className="absolute inset-0">
        {NODES.map((n, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-primary/40 shadow-[0_0_12px_rgba(139,92,246,0.6)] animate-node-float"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              animationDelay: `${n.delay}s`,
              animationDuration: `${n.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Top vignette fade so content reads cleanly */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/60" />
    </div>
  );
}

const NODES = [
  { x: 8,  y: 22, size: 4, delay: 0,   duration: 14 },
  { x: 18, y: 70, size: 3, delay: 2,   duration: 18 },
  { x: 32, y: 14, size: 5, delay: 4,   duration: 16 },
  { x: 47, y: 55, size: 3, delay: 1,   duration: 20 },
  { x: 60, y: 28, size: 4, delay: 6,   duration: 15 },
  { x: 72, y: 78, size: 5, delay: 3,   duration: 17 },
  { x: 85, y: 40, size: 3, delay: 5,   duration: 19 },
  { x: 92, y: 15, size: 4, delay: 7,   duration: 13 },
  { x: 24, y: 88, size: 4, delay: 8,   duration: 21 },
  { x: 55, y: 90, size: 3, delay: 2.5, duration: 16 },
];
