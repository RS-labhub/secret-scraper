"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TerminalSquare, Github, LayoutGrid, Zap } from "lucide-react"
import { AIServiceManager } from "@/components/ai-service-manager"
import { motion } from "framer-motion"

export function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const [showAIManager, setShowAIManager] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      <div className="glow-orb" />
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center z-10">
        
        {/* Left Col: Copy & Call to action */}
        <div className="space-y-8 animate-fade-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 font-mono text-xs uppercase tracking-widest border border-primary/30 text-primary bg-primary/5">
            <Zap className="w-3 h-3" /> System Initialization
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter uppercase leading-[0.85] text-balance">
            Scrape. <br/><span className="text-primary">Amplify.</span> <br/>Ship.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg font-mono leading-relaxed border-l-2 border-primary/50 pl-4">
            Transform raw GitHub repositories and Product Hunt launches into structured, AI-enhanced intelligence. Ready for CMS injection in seconds.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowAIManager(true)}
              className="btn-brutal text-lg"
            >
              Connect API Key <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <Button variant="outline" size="lg" className="rounded-none border-border font-mono h-[50px] uppercase tracking-wider" onClick={onComplete}>
              Continue Without AI
            </Button>
            <Button variant="outline" size="lg" className="rounded-none border-border font-mono h-[50px] uppercase tracking-wider hidden sm:flex" asChild>
              <a href="/examples">Examples</a>
            </Button>
          </div>
        </div>

        {/* Right Col: Visual Representation / Diagram */}
        <div className="relative animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent blur-3xl -z-10 rounded-full" />
           <div className="card-brutal space-y-6 relative overflow-hidden bg-card/80 backdrop-blur-md">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
             
             <div className="border border-border p-4 bg-black/50 font-mono text-sm">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground w-full border-b border-border/50 pb-2">
                  <TerminalSquare className="w-4 h-4" /> RAW DATA _
                </div>
                <div className="text-muted-foreground line-clamp-2">
                  "A fast, open-source web framework for building modern applications..."
                </div>
             </div>

             <div className="flex justify-center -my-2 text-primary">
                <Sparkles className="w-6 h-6 animate-pulse" />
             </div>

             <div className="border border-primary/50 p-4 bg-primary/5 font-mono text-sm relative">
                <div className="flex items-center gap-2 mb-2 text-primary w-full border-b border-primary/20 pb-2 font-bold">
                  <Sparkles className="w-4 h-4" /> AI ENHANCED OUTPUT _
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Title:</span> <span className="text-foreground">Velocity Framework</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Category:</span> <span className="text-foreground">Web Infrastructure</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sentiment:</span> <span className="text-primary">Highly Positive</span></div>
                </div>
             </div>
           </div>
        </div>
      </div>
      
      {/* Configuration Manager */}
      <AIServiceManager 
        open={showAIManager} 
        onOpenChange={setShowAIManager} 
        onConfigChange={(configs) => {
          onComplete()
        }}
      />
    </div>
  )
}

