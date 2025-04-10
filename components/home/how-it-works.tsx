import { Card, CardContent } from "@/components/ui/card"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative">
            <Card className="h-full border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in-delay-1">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Add your products</h3>
                <p className="text-muted-foreground">
                  Upload images, videos, or even 3D models of your products with descriptions and details.
                </p>
                <div className="mt-6 flex-1 flex items-center justify-center">
                  <img
                    src="/placeholder.svg?height=200&width=300"
                    alt="Add products illustration"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary">
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="relative">
            <Card className="h-full border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in-delay-2">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Let AI help organize</h3>
                <p className="text-muted-foreground">
                  Use AI to help write descriptions or automatically group products into logical collections.
                </p>
                <div className="mt-6 flex-1 flex items-center justify-center">
                  <img
                    src="/placeholder.svg?height=200&width=300"
                    alt="AI organization illustration"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary">
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div>
            <Card className="h-full border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in-delay-3">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Share your catalog</h3>
                <p className="text-muted-foreground">
                  Share your catalog link, export as PDF, or generate a video presentation for maximum impact.
                </p>
                <div className="mt-6 flex-1 flex items-center justify-center">
                  <img
                    src="/placeholder.svg?height=200&width=300"
                    alt="Share catalog illustration"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
