import { Github, Linkedin, Twitter, Mail, ZapOff, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
          {/* Left side - Built by info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <ZapOff className="w-4 h-4 text-red-500 fill-current" />
            <span>by</span>
            <span className="font-mono font-medium text-foreground">Rohan Sharma</span>
          </div>

          {/* Right side - Social links */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://rohan-sharma-portfolio.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Portfolio</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/RS-labhub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://in.linkedin.com/in/rohan-sharma-9386rs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://twitter.com/rrs00179"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter Profile"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="mailto:rs4101976@gmail.com"
                aria-label="Send Email"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
