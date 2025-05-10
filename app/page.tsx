import Link from "next/link"
import NavigationBar from "@/components/shared/navigation/navigation-bar" // Assuming this path is correct
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight, Sparkles, Image as ImageIcon, Tags } from "lucide-react" // Added more icons

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-blue-50/50 dark:from-zinc-900 dark:to-zinc-950">
      {" "}
      {/* Added gradient background */}
      {/* Render the Navigation Bar */}
      <NavigationBar />
      {/* Main Content Area */}
      <main className="flex-grow">
        {" "}
        {/* Use flex-grow to push footer down */}
        {/* Hero Section */}
        <section className="container mx-auto grid place-items-center gap-8 px-4 py-24 text-center md:px-6 md:py-32 lg:py-40">
          <div className="space-y-6">
            {/* AI-Focused Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Craft Visually Stunning Product Catalogs, <span className="block md:inline">Powered by AI</span>
            </h1>
            {/* Enhanced Description */}
            <p className="mx-auto max-w-[750px] text-lg text-muted-foreground md:text-xl">
              Let intelligent algorithms generate descriptions, enhance images, and organize your products into
              beautiful, shareable collections in minutes, not hours. Experience the future of catalog creation.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/login" legacyBehavior passHref>
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-300 ease-in-out hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            {/* Optional: Secondary Button */}
            {/* <Link href="#features" legacyBehavior passHref>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link> */}
          </div>
          {/* Placeholder for a compelling visual (e.g., product screenshot, animation) */}
          <div className="mt-12 w-full max-w-4xl">
            {/* TODO: Add a compelling visual here (image, animation, video mockup etc.) */}
            {/* Example: <img src="/path/to/your/stunning_visual.png" alt="AI Catalog Creation" className="rounded-lg shadow-xl" /> */}
            <div className="aspect-video rounded-lg border bg-muted shadow-lg flex items-center justify-center text-muted-foreground">
              [Beautiful Product Showcase / AI Interface Preview Here]
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section
          id="features"
          className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32 bg-background/50 rounded-t-xl shadow-sm">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why Choose Our AI Catalog Builder?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
              Leverage cutting-edge AI to streamline your workflow and create catalogs that captivate.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: AI Descriptions */}
            <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle>AI Description Writer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate engaging, SEO-friendly product descriptions automatically based on images or keywords. Save
                  hours of writing time.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2: Smart Image Enhancement */}
            <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <CardTitle>Smart Image Enhancement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically enhance product photos, remove backgrounds, and ensure visual consistency across your
                  catalog.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3: Intelligent Organization */}
            <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Tags className="h-6 w-6" />
                </div>
                <CardTitle>Intelligent Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our AI suggests relevant tags and categories for your products, making organization and filtering
                  effortless.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 4: Beautiful Templates (Optional) */}
            {/* <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                 <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <LayoutTemplate className="h-6 w-6" />
                 </div>
                 <CardTitle>AI-Optimized Templates</CardTitle>
              </CardHeader>
              <CardContent>
                 <CardDescription>Start with beautifully designed, responsive templates suggested by AI based on your product type and industry.</CardDescription>
              </CardContent>
            </Card> */}
          </div>
        </section>
        {/* How It Works Section (Simplified) */}
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Get Started in 3 Simple Steps</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
              Creating stunning catalogs has never been easier.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Upload Products</h3>
              <p className="text-muted-foreground">Quickly add your product details and images.</p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Let AI Enhance</h3>
              <p className="text-muted-foreground">
                Watch as AI generates descriptions, improves visuals, and organizes everything.
              </p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Customize & Share</h3>
              <p className="text-muted-foreground">
                Fine-tune the look, choose a template, and share your beautiful catalog.
              </p>
            </div>
          </div>
          {/* Another CTA */}
          <div className="mt-16 text-center">
            <Link href="/auth/login" legacyBehavior passHref>
              <Button size="lg" className="group transition-transform duration-300 ease-in-out hover:scale-105">
                Start Creating Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="w-full border-t bg-background py-6">
        {" "}
        {/* Removed fixed positioning */}
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Your AI Catalog App. All rights reserved. {/* Customize App Name */}
          {/* Optional: Add links like Privacy Policy, Terms of Service */}
          {/* <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div> */}
        </div>
      </footer>
    </div>
  )
}
