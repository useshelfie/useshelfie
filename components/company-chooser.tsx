"use client" // Mark as a client component

import { CompanySupabaseData } from "@/schemas/companySchema"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Props {
  companies: CompanySupabaseData[]
}

export default function CompanyChooser({ companies }: Props) {
  const pathname = usePathname() // Get the current URL path
  const [currentCompanyId, setCurrentCompanyId] = useState<string>("")
  const [pathAfterCompany, setPathAfterCompany] = useState<string>("")

  // Parse the pathname to extract company ID and remaining path
  useEffect(() => {
    if (!pathname) return // Wait for pathname to be available

    console.log("Current pathname:", pathname) // Debug log

    // Check if the path starts with '/dashboard/'
    if (pathname.startsWith("/dashboard/")) {
      const pathParts = pathname.slice("/dashboard/".length).split("/")
      const companyId = pathParts[0] // First segment after /dashboard/
      const remainingPath = pathParts.slice(1).join("/") // Rest of the path

      console.log("Parsed - companyId:", companyId, "pathAfterCompany:", remainingPath) // Debug log

      setCurrentCompanyId(companyId)
      setPathAfterCompany(remainingPath)
    } else {
      // Reset state if not on a dashboard route
      setCurrentCompanyId("")
      setPathAfterCompany("")
    }
  }, [pathname]) // Re-run when pathname changes

  return (
    <div className="flex gap-2 items-center">
      {/* Create Link */}
      <Link
        href={`/dashboard/create${pathAfterCompany ? `/${pathAfterCompany}` : ""}`}
        className="cursor-pointer rounded-full border-dashed border-2 flex items-center p-3 hover:bg-zinc-200 transition-all duration-200">
        <PlusIcon />
      </Link>

      {/* Company Links */}
      {companies.map((company) => {
        const isCurrent = currentCompanyId === String(company.id) // Ensure type consistency
        const href = `/dashboard/${company.id}${pathAfterCompany ? `/${pathAfterCompany}` : ""}`

        console.log(`Company ${company.id}: isCurrent=${isCurrent}, href=${href}`) // Debug log

        return (
          <Link
            href={href}
            className={cn(
              "cursor-pointer border-1 border-zinc-300 p-2 px-2 pr-4 flex gap-2 items-center rounded-full hover:bg-zinc-200 transition-all duration-200",
              isCurrent ? "bg-zinc-200" : ""
            )}
            key={company.id}>
            <Avatar>
              <AvatarFallback className="bg-black text-white">{company.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center">{company.name}</div>
          </Link>
        )
      })}
    </div>
  )
}
