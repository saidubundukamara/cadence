import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { SocialProofBar } from "@/components/landing/social-proof-bar"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { BackgroundEffects } from "@/components/landing/background-effects"

export default function LandingPage() {
  return (
    <SessionProvider>
      {/* Soft pastel gradient blobs */}
      <BackgroundEffects />

      <div id="top" className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <SocialProofBar />
          <StatsSection />
          <FeaturesSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </SessionProvider>
  )
}
