'use client'

interface KeyboardShortcutsHelpProps {
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { key: 'c', description: 'Compose new email' },
    { key: 'r', description: 'Reply to selected email' },
    { key: 'f', description: 'Forward selected email' },
    { key: 'e', description: 'Archive selected email' },
    { key: 'u', description: 'Toggle read/unread status' },
    { key: 'Delete', description: 'Delete selected email' },
    { key: '↑ / k', description: 'Navigate to previous email' },
    { key: '↓ / j', description: 'Navigate to next email' },
    { key: 'Esc', description: 'Close modal or deselect email' },
    { key: '?', description: 'Show this help menu' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-2xl mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-glass">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="glass-button text-glass p-2 rounded-full hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between glass rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <span className="text-glass flex-1">{shortcut.description}</span>
              <kbd className="glass-button px-3 py-1.5 rounded-lg text-glass font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-glass">
          <p className="text-glass-dark text-sm text-center">
            Press <kbd className="glass px-2 py-1 rounded text-xs">Esc</kbd> or{' '}
            <kbd className="glass px-2 py-1 rounded text-xs">?</kbd> to close this dialog
          </p>
        </div>
      </div>
    </div>
  )
}