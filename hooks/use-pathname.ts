import * as React from "react"

export default function usePathname() {
  const [pathname, setPathname] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    const handlePathnameChange = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener("popstate", handlePathnameChange)
    window.addEventListener("pushstate", handlePathnameChange)
    window.addEventListener("replacestate", handlePathnameChange)

    return () => {
      window.removeEventListener("popstate", handlePathnameChange)
      window.removeEventListener("pushstate", handlePathnameChange)
      window.removeEventListener("replacestate", handlePathnameChange)
    }
  }, [])

  return pathname
}
