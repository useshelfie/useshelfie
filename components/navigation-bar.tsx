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
import { Mountain } from "lucide-react" // Example icon

export default async function NavigationBar() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About Us" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Brand/Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Mountain className="h-6 w-6" />
          <span className="font-bold">My App</span>
        </Link>

        {/* Main Navigation */}
        <NavigationMenu className="flex-1">
          {" "}
          {/* Allow menu to take space */}
          <NavigationMenuList>
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <Link href={link.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>{link.label}</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Actions */}
        <div className="flex items-center justify-end space-x-4 ml-6">
          {" "}
          {/* Add margin-left */}
          {isAuthenticated ? (
            <Link href="/dashboard" legacyBehavior passHref>
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link href="/auth/login" legacyBehavior passHref>
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
