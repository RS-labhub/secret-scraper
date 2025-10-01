"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light"
    setTheme(newTheme)
    
    // Debug: Log theme changes
    console.log("Theme changed from", resolvedTheme, "to", newTheme)
    console.log("HTML class list:", document.documentElement.classList.toString())
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="cursor-pointer h-8 w-8 px-0 relative"
      title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
    >
      {/* Sun - visible in light mode, hidden in dark mode */}
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
        resolvedTheme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
      }`} />
      
      {/* Moon - hidden in light mode, visible in dark mode */}
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
        resolvedTheme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      }`} />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
