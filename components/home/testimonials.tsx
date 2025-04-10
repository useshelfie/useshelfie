import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      "Shelfie has transformed how I present my product line to clients. The interactive catalogs are so much more engaging than PDFs.",
    author: "Alex Morgan",
    role: "Independent Sales Rep",
    avatar: "AM",
  },
  {
    quote:
      "As a small business owner, I needed something professional without the learning curve. Shelfie is exactly what I was looking for.",
    author: "Jamie Chen",
    role: "Boutique Owner",
    avatar: "JC",
  },
  {
    quote:
      "The ability to self-host was crucial for our agency. We love that it's open source and we can customize it for our needs.",
    author: "Taylor Wilson",
    role: "Digital Agency Founder",
    avatar: "TW",
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Community Love</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-lg mb-6 flex-1">&quot;{testimonial.quote}&quot;</blockquote>
                <div className="flex items-center mt-auto">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={`/placeholder.svg?height=40&width=40&text=${testimonial.avatar}`}
                      alt={testimonial.author}
                    />
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
