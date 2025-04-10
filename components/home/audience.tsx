import { User, Briefcase, Palette, Users, Rocket } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const audiences = [
  {
    icon: <User className="h-10 w-10 text-primary" />,
    title: "Solopreneurs & Indie Sellers",
    description: "Create professional catalogs without design skills or expensive tools.",
  },
  {
    icon: <Briefcase className="h-10 w-10 text-primary" />,
    title: "Sales Representatives",
    description: "Share your products on the go with interactive, always up-to-date catalogs.",
  },
  {
    icon: <Palette className="h-10 w-10 text-primary" />,
    title: "Digital Content Creators",
    description: "Showcase your portfolio with beautiful, customizable layouts.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Agencies & Marketing Teams",
    description: "Collaborate on client presentations with real-time updates and sharing.",
  },
  {
    icon: <Rocket className="h-10 w-10 text-primary" />,
    title: "Startups & Pitch Builders",
    description: "Create impressive product demos and pitch decks that stand out.",
  },
]

export function Audience() {
  return (
    <section className="py-16 md:py-24 px-4 bg-secondary/50 dark:bg-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Who Is It For?</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Shelfie is designed for anyone who needs to showcase products or collections in a professional, engaging way.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <Card
              key={index}
              className="border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">{audience.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{audience.title}</h3>
                <p className="text-muted-foreground">{audience.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
