/**
 * Soft pastel gradient blobs scattered across the page background.
 * Gives the page a warm, watercolor-like depth without feeling heavy.
 * Includes small scattered dot decorations as subtle confetti.
 */

/** Small colored dot positions for confetti effect */
const confettiDots: { top: string; left?: string; right?: string; size: string; color: string }[] = [
  { top: "8%", left: "5%", size: "size-2", color: "bg-accent-mint/30" },
  { top: "15%", right: "8%", size: "size-1.5", color: "bg-[oklch(0.85_0.06_50)]/35" },
  { top: "35%", left: "3%", size: "size-2.5", color: "bg-[oklch(0.88_0.05_290)]/25" },
  { top: "50%", right: "4%", size: "size-2", color: "bg-accent-mint/25" },
  { top: "65%", left: "8%", size: "size-1.5", color: "bg-[oklch(0.88_0.06_50)]/30" },
  { top: "72%", right: "12%", size: "size-2", color: "bg-[oklch(0.86_0.05_290)]/30" },
  { top: "88%", left: "12%", size: "size-2.5", color: "bg-accent-mint/20" },
  { top: "92%", right: "6%", size: "size-1.5", color: "bg-[oklch(0.87_0.05_50)]/25" },
]

export function BackgroundEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Top-right — soft mint blob behind hero */}
      <div
        className="animate-blob-drift absolute -top-24 right-[10%] h-[500px] w-[600px] rounded-full opacity-50 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.9 0.08 160), transparent)" }}
      />

      {/* Top-left — warm peach/coral blob (complements mint) */}
      <div
        className="animate-blob-drift absolute -top-16 left-[5%] h-[420px] w-[480px] rounded-full opacity-35 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.93 0.05 50), transparent)", animationDelay: "-10s" }}
      />

      {/* Left side — warm peach/blush accent */}
      <div
        className="animate-blob-drift absolute top-[60vh] -left-24 h-[400px] w-[450px] rounded-full opacity-35 blur-[90px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.92 0.06 60), transparent)", animationDelay: "-7s" }}
      />

      {/* Center — very subtle mint wash around stats */}
      <div
        className="absolute top-[130vh] left-1/2 -translate-x-1/2 h-[350px] w-[500px] rounded-full opacity-40 blur-[80px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.93 0.05 160), transparent)" }}
      />

      {/* Near features — subtle lavender blob */}
      <div
        className="absolute top-[170vh] left-[20%] h-[380px] w-[420px] rounded-full opacity-30 blur-[90px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.93 0.04 290), transparent)" }}
      />

      {/* Right — lavender accent around features */}
      <div
        className="animate-blob-drift absolute top-[200vh] right-[5%] h-[400px] w-[450px] rounded-full opacity-30 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.9 0.06 290), transparent)", animationDelay: "-13s" }}
      />

      {/* Bottom — mint blob near CTA */}
      <div
        className="animate-blob-drift absolute top-[310vh] left-[15%] h-[350px] w-[400px] rounded-full opacity-40 blur-[90px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.91 0.07 160), transparent)", animationDelay: "-4s" }}
      />

      {/* Scattered confetti dots */}
      {confettiDots.map((dot, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${dot.size} ${dot.color}`}
          style={{
            top: dot.top,
            left: dot.left,
            right: dot.right,
          }}
        />
      ))}
    </div>
  )
}
