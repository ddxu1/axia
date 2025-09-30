import { useEffect } from 'react'

interface KeyboardShortcutsConfig {
  enabled: boolean
  onCompose?: () => void
  onReply?: () => void
  onForward?: () => void
  onArchive?: () => void
  onToggleRead?: () => void
  onDelete?: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onEscape?: () => void
  onShowHelp?: () => void
  hasSelectedEmail?: boolean
  isModalOpen?: boolean
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    enabled,
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
    hasSelectedEmail = false,
    isModalOpen = false,
  } = config

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      const key = event.key.toLowerCase()

      // Handle Escape key separately (works even in modals, but not while typing)
      if (key === 'escape') {
        if (!isTyping && onEscape) {
          event.preventDefault()
          onEscape()
        }
        return
      }

      // Don't handle other shortcuts while typing
      if (isTyping) return

      // Don't handle other shortcuts if a modal is open
      if (isModalOpen) return

      // Global shortcuts (work regardless of email selection)
      if (key === '?' && onShowHelp) {
        event.preventDefault()
        onShowHelp()
        return
      }

      if (key === 'c' && onCompose) {
        event.preventDefault()
        onCompose()
        return
      }

      // Navigation shortcuts (work regardless of email selection)
      if ((key === 'arrowdown' || key === 'j') && onNavigateDown) {
        event.preventDefault()
        onNavigateDown()
        return
      }

      if ((key === 'arrowup' || key === 'k') && onNavigateUp) {
        event.preventDefault()
        onNavigateUp()
        return
      }

      // Email-specific shortcuts (only work when email is selected)
      if (!hasSelectedEmail) return

      switch (key) {
        case 'r':
          // Only trigger reply if no modifier keys are pressed (to allow cmd+r for refresh)
          if (onReply && !event.metaKey && !event.ctrlKey) {
            event.preventDefault()
            onReply()
          }
          break
        case 'f':
          if (onForward) {
            event.preventDefault()
            onForward()
          }
          break
        case 'e':
          if (onArchive) {
            event.preventDefault()
            onArchive()
          }
          break
        case 'u':
          if (onToggleRead) {
            event.preventDefault()
            onToggleRead()
          }
          break
        case 'delete':
        case 'backspace':
          if (onDelete) {
            event.preventDefault()
            onDelete()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    enabled,
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
    hasSelectedEmail,
    isModalOpen,
  ])
}