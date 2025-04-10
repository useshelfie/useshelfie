"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Github } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import Image from "next/image"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}>
      <div className="container mx-auto max-w-screen-lg flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/shelfie.png" alt="Shelfie" width={20} height={32} className="h-8" />
          <span className="font-bold text-xl tracking-tighter">Shelfie</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#open-source" className="text-sm font-medium hover:text-primary transition-colors">
              Open Source
            </Link>
            <Link
              href="https://github.com/useshelfie/useshelfie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button asChild>
              <Link href="/auth/login">Start for Free</Link>
            </Button>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-4">
          <ModeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary">
                <path d="M4 19V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                <path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                <path d="M8 11h8" />
                <path d="M8 15h5" />
              </svg>
              <span className="font-bold text-xl">Shelfie</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="container mt-8 px-4 flex flex-col gap-4">
            <Link
              href="#features"
              className="text-lg font-medium p-2 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}>
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-lg font-medium p-2 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link
              href="#open-source"
              className="text-lg font-medium p-2 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}>
              Open Source
            </Link>
            <Link
              href="https://github.com/useshelfie/useshelfie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium p-2 hover:text-primary transition-colors flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}>
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
            <div className="mt-4">
              <Button className="w-full" asChild>
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  Start for Free
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
