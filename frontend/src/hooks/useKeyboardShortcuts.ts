import { useEffect } from 'react'

interface UseKeyboardShortcutsProps {
  enabled: boolean
  hasSelectedEmail: boolean
  isModalOpen: boolean
  onCompose: () => void
  onReply: () => void
  onForward: () => void
  onArchive: () => void
  onToggleRead: () => void
  onDelete: () => void
  onNavigateUp: () => void
  onNavigateDown: () => void
  onEscape: () => void
  onShowHelp: () => void
}

export function useKeyboardShortcuts({
  enabled,
  hasSelectedEmail,
  isModalOpen,
  onCompose,
  onReply,
  onForward,
  onArchive,
  onToggleRead,
  onDelete,
  onNavigateUp,
  onNavigateDown,
  onEscape,
  onShowHelp,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Always handle escape
      if (event.key === 'Escape') {
        onEscape()
        return
      }

      // Don't handle other shortcuts if modal is open
      if (isModalOpen) return

      // Don't handle shortcuts if user is typing in an input
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Don't handle shortcuts if modifier keys are pressed (cmd, ctrl, alt, shift)
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return
      }

      // Navigation shortcuts (always available)
      switch (event.key) {
        case 'j':
        case 'ArrowDown':
          event.preventDefault()
          onNavigateDown()
          break
        case 'k':
        case 'ArrowUp':
          event.preventDefault()
          onNavigateUp()
          break
        case 'c':
          event.preventDefault()
          onCompose()
          break
        case '?':
          event.preventDefault()
          onShowHelp()
          break
      }

      // Email-specific shortcuts (only when email is selected)
      if (hasSelectedEmail) {
        switch (event.key) {
          case 'r':
            event.preventDefault()
            onReply()
            break
          case 'f':
            event.preventDefault()
            onForward()
            break
          case 'e':
            event.preventDefault()
            onArchive()
            break
          case 'u':
            event.preventDefault()
            onToggleRead()
            break
          case 'd':
            event.preventDefault()
            onDelete()
            break
          case 'Delete':
            event.preventDefault()
            onDelete()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    hasSelectedEmail,
    isModalOpen,
    onCompose,
    onReply,
    onForward,
    onArchive,
    onToggleRead,
    onDelete,
    onNavigateUp,
    onNavigateDown,
    onEscape,
    onShowHelp,
  ])
}