"use client"

export function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed AnimatePresence wait — it blocked Tasks/Journal rendering on soft navigation.
  // Keep sharp System feel: no fade, instant mount.
  return <>{children}</>
}