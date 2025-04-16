import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet" // Needed for mobile menu drawer
import { Menu, Sparkles } from "lucide-react" // Using Sparkles for AI theme, Menu for mobile

export default async function NavigationBar() {
  const supabase = await createClient() // Pass cookieStore

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" }, // Link to landing page section
    { href: "/pricing", label: "Pricing" },
    // { href: "/about", label: "About Us" }, // Optional: Keep if needed
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg transition-all duration-300 ease-in-out">
      {/* Use backdrop-blur-lg for a more pronounced effect */}
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {" "}
        {/* Increased height slightly */}
        {/* Brand/Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80" // Use gap and hover effect
        >
          <Sparkles className="h-6 w-6 text-primary" /> {/* AI-themed icon */}
          <span className="text-lg font-semibold tracking-tight">AI Catalog {/* More descriptive name? */}</span>
        </Link>
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden flex-1 justify-center md:flex">
          {" "}
          {/* Centered desktop nav, hidden on mobile */}
          <NavigationMenuList className="gap-1">
            {" "}
            {/* Add small gap between items */}
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <Link href={link.href} legacyBehavior passHref>
                  {/* Apply custom styling or use trigger style with potential hover adjustments */}
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 focus:bg-accent/50 data-[active]:bg-accent/50 text-sm font-medium transition-colors`}>
                    {link.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        {/* Auth Actions & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-4">
          {" "}
          {/* Consistent gap */}
          {/* Auth Buttons (Visible on Desktop and Larger Screens) */}
          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticated ? (
              <Link href="/dashboard" legacyBehavior passHref>
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" legacyBehavior passHref>
                  <Button variant="ghost" size="sm">
                    {" "}
                    {/* Ghost for secondary action */}
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup" legacyBehavior passHref>
                  {" "}
                  {/* Assuming a signup route */}
                  <Button size="sm">
                    Sign Up <ArrowRight className="ml-1.5 h-4 w-4" /> {/* Optional arrow */}
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile Menu Button (Visible only on smaller screens) */}
          {/* IMPORTANT: This requires making the component a "use client" component */}
          {/* and adding useState for the Sheet's open state. */}
          {/* For now, this is the visual structure. */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                {" "}
                {/* Mobile menu appears from the right */}
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-6 px-4">
                  {/* Mobile Brand/Logo */}
                  <Link href="/" className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold tracking-tight">AI Catalog</span>
                  </Link>
                  {/* Mobile Nav Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      // Add logic here to close the sheet on click if using client state
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Mobile Auth Buttons */}
                  <div className="mt-4 border-t pt-4 space-y-2">
                    {isAuthenticated ? (
                      <Link href="/dashboard" legacyBehavior passHref>
                        <Button className="w-full">Dashboard</Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/auth/login" legacyBehavior passHref>
                          <Button variant="outline" className="w-full">
                            Login
                          </Button>
                        </Link>
                        <Link href="/auth/signup" legacyBehavior passHref>
                          <Button className="w-full">Sign Up</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  )
}

// Add ArrowRight import if you use it in the Sign Up button
import { ArrowRight } from "lucide-react"
