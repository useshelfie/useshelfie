import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import Providers from "./providers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Shelfie",
    template: "%s | Shelfie",
  },
  description: "Your Smart Catalog",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <LoadingSpinner size="lg" />
              </div>
            }>
            {children}
          </Suspense>
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
