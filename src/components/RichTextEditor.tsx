'use client'

import { useRef, useEffect, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            handleBold()
            break
          case 'i':
            e.preventDefault()
            handleItalic()
            break
          case 'u':
            e.preventDefault()
            handleUnderline()
            break
        }
      }
    }

    const editor = editorRef.current
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown)
      return () => editor.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      updateFormattingState()
    }
  }

  const updateFormattingState = () => {
    setIsBold(document.queryCommandState('bold'))
    setIsItalic(document.queryCommandState('italic'))
    setIsUnderline(document.queryCommandState('underline'))
  }

  const handleBold = () => {
    document.execCommand('bold', false)
    updateFormattingState()
    editorRef.current?.focus()
  }

  const handleItalic = () => {
    document.execCommand('italic', false)
    updateFormattingState()
    editorRef.current?.focus()
  }

  const handleUnderline = () => {
    document.execCommand('underline', false)
    updateFormattingState()
    editorRef.current?.focus()
  }

  const handleLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      document.execCommand('createLink', false, url)
      editorRef.current?.focus()
    }
  }

  const handleBulletList = () => {
    document.execCommand('insertUnorderedList', false)
    editorRef.current?.focus()
  }

  const handleNumberedList = () => {
    document.execCommand('insertOrderedList', false)
    editorRef.current?.focus()
  }

  return (
    <div className={`border border-glass rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b border-glass bg-white/5">
        <button
          type="button"
          onClick={handleBold}
          tabIndex={-1}
          className={`glass-button p-2 rounded text-xs ${isBold ? 'bg-blue-500/30' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={handleItalic}
          tabIndex={-1}
          className={`glass-button p-2 rounded text-xs ${isItalic ? 'bg-blue-500/30' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          tabIndex={-1}
          className={`glass-button p-2 rounded text-xs ${isUnderline ? 'bg-blue-500/30' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-glass mx-1"></div>
        <button
          type="button"
          onClick={handleLink}
          tabIndex={-1}
          className="glass-button p-2 rounded text-xs"
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleBulletList}
          tabIndex={-1}
          className="glass-button p-2 rounded text-xs"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          tabIndex={-1}
          className="glass-button p-2 rounded text-xs"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] text-glass focus:outline-none"
        onInput={handleInput}
        onMouseUp={updateFormattingState}
        onKeyUp={updateFormattingState}
        suppressContentEditableWarning={true}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}