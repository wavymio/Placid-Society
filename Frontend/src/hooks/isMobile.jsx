import { useEffect, useState } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: coarse)")
    const screenQuery = window.matchMedia("(max-width: 768px)")

    const updatePointer = () => setIsMobile(pointerQuery.matches)
    const updateScreen = () => setIsSmallScreen(screenQuery.matches)

    // Initial checks
    updatePointer()
    updateScreen()

    // Listeners
    pointerQuery.addEventListener("change", updatePointer)
    screenQuery.addEventListener("change", updateScreen)

    return () => {
      pointerQuery.removeEventListener("change", updatePointer)
      screenQuery.removeEventListener("change", updateScreen)
    }
  }, [])

  return { isMobile, isSmallScreen }
}