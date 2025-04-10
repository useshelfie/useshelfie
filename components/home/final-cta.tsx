import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function FinalCta() {
  return (
    <section id="start" className="py-16 md:py-24 px-4 bg-primary/10 dark:bg-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(120,80,240,0.1),transparent_60%)]" />
      <div className="container relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create your first catalog?</h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the growing community of creators and businesses using Shelfie to showcase their products in style.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="https://useshelfie.com">Try Shelfie Now</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link
              href="https://github.com/useshelfie/useshelfie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <span>View GitHub Repo</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
