import { useEffect, useState } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)")
    setIsMobile(media.matches)

    const handler = e => setIsMobile(e.matches)
    media.addEventListener("change", handler)

    return () => media.removeEventListener("change", handler)
  }, [])

  return isMobile
}