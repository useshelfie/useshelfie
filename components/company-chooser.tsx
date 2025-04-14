"use client" // Mark as a client component

// import { CompanySupabaseData } from "@/schemas/companySchema" // No longer needed for props
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button" // Import Button for the trigger
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Import Dropdown components
import { PlusIcon, ChevronsUpDown } from "lucide-react" // Import ChevronsUpDown for trigger
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react" // Import useMemo
import Link from "next/link"
import { usePathname } from "next/navigation"

// Define a simpler interface matching the fetched data
interface CompanyChooserProps {
  id: number // Assuming company.id is a number based on schema
  name: string
}

interface Props {
  companies: CompanyChooserProps[] // Use the simpler interface
}

export default function CompanyChooser({ companies }: Props) {
  const pathname = usePathname() // Get the current URL path
  const [currentCompanyId, setCurrentCompanyId] = useState<string>("")
  const [pathAfterCompany, setPathAfterCompany] = useState<string>("")

  // Parse the pathname to extract company ID and remaining path
  useEffect(() => {
    if (!pathname) return // Wait for pathname to be available

    if (pathname.startsWith("/dashboard/")) {
      const pathParts = pathname.slice("/dashboard/".length).split("/")
      const companyId = pathParts[0]
      // Check if the first part is a number (potential company ID)
      if (companyId && !isNaN(Number(companyId))) {
        const remainingPath = pathParts.slice(1).join("/")
        setCurrentCompanyId(companyId)
        setPathAfterCompany(remainingPath)
      } else {
        // If the part after /dashboard/ is not a number, it's not a company ID path
        setCurrentCompanyId("")
        setPathAfterCompany(pathname.slice("/dashboard/".length)) // Keep the rest for potential non-company paths
      }
    } else {
      // Reset state if not on a dashboard route
      setCurrentCompanyId("")
      setPathAfterCompany("")
    }
  }, [pathname]) // Re-run when pathname changes

  // Find the currently selected company object
  const currentCompany = useMemo(() => {
    if (!currentCompanyId) return null
    return companies.find((company) => String(company.id) === currentCompanyId)
  }, [currentCompanyId, companies])

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[200px] justify-between">
            {currentCompany ? (
              <>
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarFallback>
                    {currentCompany.name ? currentCompany.name[0].toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                {currentCompany.name}
              </>
            ) : (
              "Select company..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] p-0">
          <DropdownMenuLabel>Select Company</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => {
            const href = `/dashboard/${company.id}${pathAfterCompany ? `/${pathAfterCompany}` : ""}`
            const isCurrent = currentCompanyId === String(company.id) // Use for potential styling if needed

            return (
              <Link href={href} key={company.id} passHref>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer flex gap-2 items-center",
                    isCurrent ? "bg-muted" : "" // Optional: highlight current in dropdown
                  )}>
                  <Avatar className="w-5 h-5">
                    <AvatarFallback>
                      {company.name ? company.name[0].toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  {company.name}
                </DropdownMenuItem>
              </Link>
            )
          })}
          <DropdownMenuSeparator />
          {/* Link to create a new company */}
          <Link href={`/dashboard/company/create`} passHref>
             <DropdownMenuItem className="cursor-pointer text-muted-foreground">
               <PlusIcon className="mr-2 h-4 w-4" />
               Create New Company
             </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
