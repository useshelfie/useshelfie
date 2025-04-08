import Link from "next/link"
import NavigationBar from "@/components/navigation-bar" // Assuming this path is correct
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <>
      {/* Render the Navigation Bar */}
      <NavigationBar />

      {/* Main Content Area */}
      <main className="mx-auto container">
        <section className="grid place-items-center gap-6 px-4 py-16 text-center md:px-6 md:py-24 lg:py-32">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Create & Share Beautiful Product Catalogs
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Effortlessly build, manage, and share dynamic product collections with rich media, optimized for web and
              mobile. Get started today.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/auth/login" legacyBehavior passHref>
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full border-t bg-muted/40 py-6">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} My App. All rights reserved.
        </div>
      </footer>
    </>
  )
}
