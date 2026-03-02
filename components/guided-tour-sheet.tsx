"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Terminal, Database, Brain, ArrowRight, Zap, Combine } from "lucide-react"

const TOUR_STEPS = [
  {
    title: "INITIATE_SYSTEM",
    icon: <Terminal className="w-8 h-8 text-primary" />,
    description: "Welcome to SecretScrapper. A strict, aggressive data extraction client for extracting web nodes. All interactions are stateless until published."
  },
  {
    title: "CORE_LOOP: SCRAPE",
    icon: <Database className="w-8 h-8 text-blue-500" />,
    description: "Find the 'INIT_NEW_JOB' command in the main HUD. Supply a target URL (ProductHunt, GitHub) and rip the raw structural data."
  },
  {
    title: "ENHANCEMENT: AI_MATRIX",
    icon: <Brain className="w-8 h-8 text-pink-500" />,
    description: "Raw data is loud. Select parsed nodes and merge them into the AI Matrix. The system will rewrite, summarize, and categorize."
  },
  {
    title: "PAYLOAD_DELIVERY: CMS",
    icon: <Combine className="w-8 h-8 text-emerald-500" />,
    description: "Build custom schemas to map data onto target systems. Finally, push structured output to your remote APIs."
  }
]

export function GuidedTourSheet() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Check local storage for first load
    const hasSeenTour = localStorage.getItem("ss_tour_completed")
    if (!hasSeenTour) {
      // Small delay for dramatic effect
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setOpen(false)
      localStorage.setItem("ss_tour_completed", "true")
    }
  }

  const handleSkip = () => {
    setOpen(false)
    localStorage.setItem("ss_tour_completed", "true")
  }

  const currentStep = TOUR_STEPS[step]

  return (
    <Sheet open={open} onOpenChange={(val) => {
      if(!val) handleSkip()
    }}>
      <SheetContent side="left" className="w-[400px] sm:w-[500px] border-r-2 border-primary bg-[#050505] p-0 flex flex-col font-mono">
        <SheetHeader className="p-6 border-b border-border bg-black sticky top-0 z-10 text-left">
          <SheetTitle className="font-display font-bold uppercase tracking-tighter text-2xl flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" /> SYSTEM_TUTORIAL
          </SheetTitle>
          <SheetDescription className="text-muted-foreground uppercase text-xs font-mono">
            Onboarding Protocol {step + 1} of {TOUR_STEPS.length}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-6 flex flex-col justify-center">
           <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
             <div className="w-16 h-16 border-2 border-border flex items-center justify-center bg-secondary/20">
               {currentStep.icon}
             </div>
             <div>
               <h3 className="font-display text-3xl uppercase tracking-tighter text-white mb-4">
                 {currentStep.title}
               </h3>
               <p className="text-muted-foreground text-sm leading-relaxed">
                 {currentStep.description}
               </p>
             </div>
           </div>
        </div>

        <SheetFooter className="p-6 border-t border-border bg-black sticky bottom-0 z-10 flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="rounded-none border-border font-mono uppercase text-xs w-full sm:w-auto"
          >
            SYS_SKIP
          </Button>
          <Button 
            onClick={handleNext}
            className="rounded-none bg-primary text-black hover:bg-primary/90 font-mono font-bold uppercase text-xs w-full sm:w-auto flex items-center gap-2 pb-0 pt-0"
          >
            {step === TOUR_STEPS.length - 1 ? 'END_TUTORIAL' : 'NEXT_MODULE'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
