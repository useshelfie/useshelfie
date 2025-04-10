import { Header } from "@/components/home/header"
import { Hero } from "@/components/home/hero"
import { WhyShelfie } from "@/components/home/why-shelfie"
import { Features } from "@/components/home/features"
import { Audience } from "@/components/home/audience"
import { HowItWorks } from "@/components/home/how-it-works"
import { OpenSource } from "@/components/home/open-source"
import { Testimonials } from "@/components/home/testimonials"
import { FinalCta } from "@/components/home/final-cta"
import { Footer } from "@/components/home/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <WhyShelfie />
        <Features />
        <Audience />
        <HowItWorks />
        <OpenSource />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
