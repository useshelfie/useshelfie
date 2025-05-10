import { useState, useEffect } from "react"

/**
 * Custom hook for tracking media query matches.
 * @param query The media query string (e.g., '(min-width: 768px)')
 * @returns True if the media query matches, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Ensure window is defined (for SSR compatibility)
    if (typeof window === "undefined") {
      return
    }

    const mediaQueryList = window.matchMedia(query)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Set initial state
    setMatches(mediaQueryList.matches)

    // Add listener
    // Using addEventListener for modern browsers, fallback for older ones
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener)
    } else {
      // Deprecated method for older browsers (e.g., Safari < 14)
      mediaQueryList.addListener(listener)
    }

    // Cleanup listener on component unmount
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", listener)
      } else {
        mediaQueryList.removeListener(listener)
      }
    }
  }, [query]) // Re-run effect if query changes

  return matches
}
