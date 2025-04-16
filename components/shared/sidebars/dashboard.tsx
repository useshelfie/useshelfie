import { Calendar, GalleryVerticalEnd, Home, Inbox, Search, Settings, Library } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
// import { headers } from "next/headers" // No longer needed
import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"

// Menu items.
const items = [
  {
    title: "Main",
    url: "/",
    icon: Home,
  },
  {
    title: "Products",
    url: "/products",
    icon: Inbox,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Calendar,
  },
  {
    title: "Catalogs",
    url: "/catalogs",
    icon: Library,
  },
]

const systemItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
]

// Add companyId prop
export async function DashboardSidebar({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // const headerList = await headers()
  // const currentCompanyID = headerList.get("x-current-path")?.split("/")[2] // No longer needed

  // Validate companyId (basic check)
  if (!companyId) {
    console.error("DashboardSidebar: companyId is missing!")
    // Optionally return a fallback UI or null
    return null
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {/* Consider making the logo link to the specific company dashboard or a general dashboard home */}
              <Link href={`/dashboard/${companyId}`} prefetch={true}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Shelfie</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Seller</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {/* Use the companyId prop for links */}
                    <Link href={`/dashboard/${companyId}${item.url}`} prefetch={true}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {/* Update system links if they need company context */}
                    {/* Example: <Link href={`/dashboard/${companyId}${item.url}`}> */}
                    <Link href={`/dashboard/${companyId}${item.url}`} prefetch={true}>
                      {" "}
                      {/* Assuming these are general for now */}
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="border rounded-md p-4 border-border flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Logged in as:{" "}
            <strong className="font-medium text-foreground">{user?.email ? user.email.split("@")[0] : "User"}</strong>
          </p>
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
