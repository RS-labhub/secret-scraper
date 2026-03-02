"use client"

import type React from "react"
import { useState } from "react"
import { Terminal, Book, Search, ChevronRight, Hash, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isActive = (path: string) => pathname === path

  const navContentJsx = (
    <>
      <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="SEARCH_DOCS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-border text-xs uppercase px-8 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 transition-all font-mono"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 p-2 text-[10px] text-muted-foreground border border-border bg-black font-mono">
              Search module inactive in offline local mode.
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-6 text-xs font-mono">
          <div>
            <h4 className="uppercase text-[10px] text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary/20 border border-primary/50" /> Protocol_Overview
            </h4>
            <ul className="space-y-1 border-l border-border ml-1 pl-3">
              <li>
                <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between py-1.5 px-2 transition-colors ${isActive('/docs') ? 'text-primary font-bold bg-primary/5 border border-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-[#0a0a0a]'}`}>
                  <span>Getting_Started</span>
                  {isActive('/docs') && <ChevronRight className="w-3 h-3" />}
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between py-1.5 px-2 transition-colors ${isActive('/docs/architecture') ? 'text-primary font-bold bg-primary/5 border border-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-[#0a0a0a]'}`}>
                  <span>System_Architecture</span>
                  {isActive('/docs/architecture') && <ChevronRight className="w-3 h-3" />}
                </Link>
              </li>
              <li>
                <Link href="/docs/auth" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between py-1.5 px-2 transition-colors ${isActive('/docs/auth') ? 'text-primary font-bold bg-primary/5 border border-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-[#0a0a0a]'}`}>
                  <span>Auth_Vectors</span>
                  {isActive('/docs/auth') && <ChevronRight className="w-3 h-3" />}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase text-[10px] text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary/50 border border-secondary" /> Data_Extraction
            </h4>
            <ul className="space-y-1 border-l border-border ml-1 pl-3">
              <li>
                <Link href="/docs/scraping/producthunt" onClick={() => setMobileMenuOpen(false)} className={`flex items-center py-1.5 px-2 transition-colors gap-2 ${isActive('/docs/scraping/producthunt') ? 'text-primary font-bold bg-[#0a0a0a]' : 'text-muted-foreground hover:text-primary hover:bg-[#0a0a0a]'}`}>
                  <Hash className="w-3 h-3" /> ProductHunt_Engine
                </Link>
              </li>
              <li>
                <Link href="/docs/scraping/github" onClick={() => setMobileMenuOpen(false)} className={`flex items-center py-1.5 px-2 transition-colors gap-2 ${isActive('/docs/scraping/github') ? 'text-primary font-bold bg-[#0a0a0a]' : 'text-muted-foreground hover:text-primary hover:bg-[#0a0a0a]'}`}>
                  <Hash className="w-3 h-3" /> GitHub_Scraper
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase text-[10px] text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500/50 border border-pink-500" /> Neural_Network
            </h4>
            <ul className="space-y-1 border-l border-border ml-1 pl-3">
              <li>
                <Link href="/docs/ai/providers" onClick={() => setMobileMenuOpen(false)} className={`flex items-center py-1.5 px-2 transition-colors ${isActive('/docs/ai/providers') ? 'text-pink-500 font-bold bg-[#0a0a0a]' : 'text-muted-foreground hover:text-pink-500 hover:bg-[#0a0a0a]'}`}>
                  LLM_Providers
                </Link>
              </li>
              <li>
                <Link href="/docs/ai/enhancement" onClick={() => setMobileMenuOpen(false)} className={`flex items-center py-1.5 px-2 transition-colors ${isActive('/docs/ai/enhancement') ? 'text-pink-500 font-bold bg-[#0a0a0a]' : 'text-muted-foreground hover:text-pink-500 hover:bg-[#0a0a0a]'}`}>
                  Matrix_Enhancement
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-border mt-auto font-mono">
          <Link href="/examples" className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border text-xs uppercase hover:bg-white hover:text-black transition-colors font-bold group">
            <Book className="w-4 h-4 group-hover:animate-bounce" /> View_Examples
          </Link>
        </div>
    </>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-foreground antialiased selection:bg-primary selection:text-black w-full">
      
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-[#050505] sticky top-0 z-50">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors">
          <Terminal className="w-5 h-5" />
          <span className="font-display font-bold uppercase tracking-tighter text-lg">SYS_DOCS</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 border border-border bg-black text-primary">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <aside className="fixed inset-0 top-[73px] z-40 bg-black flex flex-col md:hidden border-b border-border overflow-y-auto">
          {navContentJsx}
        </aside>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 border-r border-border bg-[#050505] sticky top-0 h-screen overflow-y-auto flex-col hide-scrollbar">
        <div className="p-6 border-b border-border">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors group">
            <Terminal className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold uppercase tracking-tighter text-lg">SYS_DOCS</span>
          </Link>
        </div>
        {navContentJsx}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-black w-full min-w-0 h-full">
        <div className="w-full max-w-[100vw] sm:max-w-none md:max-w-4xl mx-auto px-4 py-8 md:px-12 md:py-20 lg:p-24 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
