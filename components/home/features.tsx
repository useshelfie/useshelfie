import { Code, Sparkles, DropletsIcon as DragDropIcon, Share2, FileText, Video, Lock, Code2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: <Code className="h-6 w-6 text-primary" />,
    title: "Open Source & Self-hostable",
    description: "Full control over your data with the ability to self-host or contribute to the codebase.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: "AI-Powered Descriptions",
    description: "Generate professional product descriptions with just a few clicks.",
  },
  {
    icon: <DragDropIcon className="h-6 w-6 text-primary" />,
    title: "Drag-and-Drop Collections",
    description: "Easily organize products into beautiful, customizable collections.",
  },
  {
    icon: <Share2 className="h-6 w-6 text-primary" />,
    title: "Shareable Catalog Links",
    description: "Share your catalogs instantly with custom links and tracking.",
  },
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: "PDF Export",
    description: "Export your catalogs as professional PDFs for offline sharing.",
  },
  {
    icon: <Video className="h-6 w-6 text-primary" />,
    title: "Remotion-Powered Video",
    description: "Create dynamic video presentations of your product catalogs.",
  },
  {
    icon: <Lock className="h-6 w-6 text-primary" />,
    title: "Public or Private Modes",
    description: "Control who can view your catalogs with flexible privacy settings.",
  },
  {
    icon: <Code2 className="h-6 w-6 text-primary" />,
    title: "Built with Modern Tech",
    description: "TypeScript, Next.js & Tailwind for a robust, extensible platform.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Core Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 flex flex-col items-start">
                <div className="rounded-full bg-primary/10 p-3 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
