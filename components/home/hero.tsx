import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 px-4">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent dark:from-primary/5" />
      <div className="container relative mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <div className="flex gap-2">
                <div className="inline-flex items-center rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary mb-6">
                  <span className="mr-1">✨</span> Open Source
                </div>
                <div className="inline-flex items-center rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary mb-6">
                  <span className="mr-1">🚀</span> Next.js Global Hackathon
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                The Open Source Catalog Builder for Creators and Teams
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Create stunning digital catalogs with AI, media, and instant share links — no code required.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/login">Start for Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="https://github.com/useshelfie/useshelfie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <span>Explore on GitHub</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative lg:ml-auto animate-float">
            <div className="relative rounded-xl border bg-background shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5" />
              <Image
                src="/images/home/infinitecanvas.png"
                alt="Shelfie interface preview"
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
