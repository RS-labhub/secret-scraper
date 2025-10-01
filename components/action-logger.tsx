"use client"

import { useState, useEffect } from "react"
import { X, Info, CheckCircle, AlertCircle, Download } from "lucide-react"
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
    // Load logs from storage when component mounts
    const savedLogs = loadFromStorage<LogMessage[]>("actionLogs", [])
    setLogs(savedLogs)
    
    // Subscribe to custom log events
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
      // Check for recent duplicate messages to prevent spam
      const isDuplicate = prev.some(existingLog => 
        existingLog.message === newLog.message && 
        existingLog.type === newLog.type &&
        Date.now() - parseInt(existingLog.id.split('-')[0]) < 1000 // Within last second
      )
      
      if (isDuplicate) {
        return prev // Don't add duplicate
      }
      
      const updated = [newLog, ...prev.slice(0, 99)] // Keep only last 100 logs
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
    
    // Create downloadable content in multiple formats
    const jsonContent = JSON.stringify(logData, null, 2)
    const csvContent = [
      'Timestamp,Type,Message',
      ...logData.map(log => 
        `"${log.timestamp}","${log.type}","${log.message.replace(/"/g, '""')}"`
      )
    ].join('\n')
    
    // Create and download the file
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
    
    logAction("success", `Downloaded ${logs.length} log entries`)
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Activity Log</h3>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadLogs} className="cursor-pointer">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearLogs} className="cursor-pointer">
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-48">
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity logged yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-md flex items-start gap-3 text-sm ${
                    log.type === "error"
                      ? "bg-destructive/10 border border-destructive/20"
                      : log.type === "success"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-card border border-border"
                  }`}
                >
                  {log.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  ) : log.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{log.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
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

// Helper function to log messages from anywhere in the app
export function logAction(type: LogMessage["type"], message: string) {
  // Use setTimeout to defer the state update to avoid React rendering issues
  setTimeout(() => {
    const event = new CustomEvent('app:log', {
      detail: { type, message }
    })
    window.dispatchEvent(event)
  }, 0)
}
