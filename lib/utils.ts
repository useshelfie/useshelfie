import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

export function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  return parts.map((segment, i) => ({
    name: decodeURIComponent(segment),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }))
}

export async function getClientCookie(name: string): Promise<string | null> {
  // @ts-expect-error
  const cookie = await window.cookieStore.get(name)
  if (!cookie) {
    console.log("Cookie not found:", name)
    return null
  }
  return cookie?.value
}

export function setClientCookie(name: string, value: string) {
  // @ts-expect-error
  window.cookieStore.set(name, value)
  console.log("Set new cookie:", name, value)
}
