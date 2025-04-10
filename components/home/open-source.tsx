import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, Star } from "lucide-react"

export function OpenSource() {
  return (
    <section id="open-source" className="py-16 md:py-24 px-4 bg-secondary/50 dark:bg-secondary/10">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Built With Transparency</h2>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Shelfie is open-source and community-driven. Fork it, contribute, or self-host it — we believe great tools
          should be accessible to everyone.
        </p>

        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border/40 mb-6">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">1.2k</span>
            <span className="text-muted-foreground">GitHub stars and growing</span>
          </div>

          <Button size="lg" asChild>
            <Link
              href="https://github.com/useshelfie/useshelfie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <span>View on GitHub</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center p-4">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <p className="text-muted-foreground text-center">Open Source</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="text-3xl font-bold text-primary mb-2">MIT</div>
            <p className="text-muted-foreground text-center">Licensed</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="text-3xl font-bold text-primary mb-2">30+</div>
            <p className="text-muted-foreground text-center">Contributors</p>
          </div>
        </div>
      </div>
    </section>
  )
}
