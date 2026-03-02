"use client"

import { useState, useEffect } from "react"
import { OnboardingView } from "@/components/onboarding-view"
import { DashboardView } from "@/components/dashboard-view"
import { loadFromStorage } from "@/lib/storage"
import type { AIServiceConfig } from "@/types/product"

export default function HomePage() {
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null)

  useEffect(() => {
    const savedServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
    const active = savedServices.find(s => s.enabled && s.apiKey)
    setHasAiKey(!!active)
  }, [])

  if (hasAiKey === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!hasAiKey) {
    return <OnboardingView onComplete={() => setHasAiKey(true)} />
  }

  return <DashboardView />
}
