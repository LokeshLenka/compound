"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) return
    if (window.matchMedia("(display-mode: standalone)").matches) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (!deferred || dismissed) return null

  const install = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "accepted") setDeferred(null)
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card px-4 py-3 shadow-lg md:bottom-4">
      <p className="text-sm font-medium">Install Compound for offline use</p>
      <Button size="sm" onClick={install}>
        <Download className="mr-1 size-3.5" />
        Install
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Dismiss install prompt"
        onClick={() => setDismissed(true)}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}