"use client"

import { useState, useEffect } from "react"
import { X, Info, CheckCircle, AlertCircle, Download, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { loadFromStorage, saveToStorage } from "@/lib/storage"

export type LogMessage = {
  id: string
  type: "info" | "success" | "error"
  message: string
  timestamp: string
}

interface ActionLoggerProps {
  isOpen: boolean
  onClose: () => void
}

export function ActionLogger({ isOpen, onClose }: ActionLoggerProps) {
  const [logs, setLogs] = useState<LogMessage[]>([])

  useEffect(() => {
    const savedLogs = loadFromStorage<LogMessage[]>("actionLogs", [])
    setLogs(savedLogs)

    const handleLogEvent = (event: CustomEvent) => {
      const newLog = event.detail
      addLogMessage(newLog.type, newLog.message)
    }

    window.addEventListener('app:log' as any, handleLogEvent as EventListener)

    return () => {
      window.removeEventListener('app:log' as any, handleLogEvent as EventListener)
    }
  }, [])

  const addLogMessage = (type: LogMessage["type"], message: string) => {
    const newLog: LogMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      message,
      timestamp: new Date().toISOString()
    }

    setLogs(prev => {
      const isDuplicate = prev.some(existingLog =>
        existingLog.message === newLog.message &&
        existingLog.type === newLog.type &&
        Date.now() - parseInt(existingLog.id.split('-')[0]) < 1000
      )

      if (isDuplicate) {
        return prev
      }

      const updated = [newLog, ...prev.slice(0, 99)]
      saveToStorage("actionLogs", updated)
      return updated
    })
  }

  const clearLogs = () => {
    setLogs([])
    saveToStorage("actionLogs", [])
  }

  const downloadLogs = () => {
    if (logs.length === 0) return

    const logData = logs.map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      type: log.type.toUpperCase(),
      message: log.message
    }))

    const jsonContent = JSON.stringify(logData, null, 2)

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `activity-logs-${timestamp}.json`

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logAction("success", `DOWNLOADED_${logs.length}_LOG_ENTRIES`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2 bg-black">
          <h3 className="text-xs font-mono uppercase text-primary flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            SYS_LOG_TERMINAL
          </h3>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadLogs} className="rounded-none border-border font-mono text-[9px] uppercase h-7 cursor-pointer hover:bg-secondary">
                <Download className="w-3 h-3 mr-1" />
                DUMP_LOGS
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearLogs} className="rounded-none border-border font-mono text-[9px] uppercase h-7 cursor-pointer hover:bg-destructive/20 hover:text-destructive hover:border-destructive">
              PURGE
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-7 w-7 p-0 cursor-pointer hover:bg-secondary">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-48 bg-[#0a0a0a] border border-border p-2">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center font-mono text-[10px] text-muted-foreground uppercase opacity-50">
              [ TERMINAL_IDLE: NO_ACTIVITY_REGISTERED ]
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 flex items-start gap-3 font-mono text-[10px] uppercase border-l-2 ${
                    log.type === "error"
                      ? "bg-destructive/5 border-l-destructive text-destructive"
                      : log.type === "success"
                      ? "bg-primary/5 border-l-primary text-primary"
                      : "bg-secondary/10 border-l-muted-foreground text-foreground"
                  }`}
                >
                  <div className="flex-1 flex gap-3">
                    <span className="opacity-50 shrink-0 select-none">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
                    </span>
                    <span className="font-bold shrink-0 w-16">
                      {log.type === "error" ? "ERR" : log.type === "success" ? "OK" : "INF"}
                    </span>
                    <span className="flex-1 truncate">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export function logAction(type: LogMessage["type"], message: string) {
  setTimeout(() => {
    const event = new CustomEvent('app:log', {
      detail: { type, message }
    })
    window.dispatchEvent(event)
  }, 0)
}

