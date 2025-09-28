'use client'

import { useState, useEffect } from 'react'

interface Label {
  id: string
  name: string
  type: string
}

interface LabelManagerProps {
  emailId: string
  currentLabels: string[]
  onLabelsUpdate: (emailId: string, labels: string[]) => void
  onClose: () => void
}

export default function LabelManager({ emailId, currentLabels, onLabelsUpdate, onClose }: LabelManagerProps) {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>(currentLabels)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetchLabels()
  }, [])

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels')
      if (response.ok) {
        const data = await response.json()
        setAvailableLabels(data.labels)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const handleApply = async () => {
    setApplying(true)

    const labelsToAdd = selectedLabels.filter(id => !currentLabels.includes(id))
    const labelsToRemove = currentLabels.filter(id => !selectedLabels.includes(id))

    try {
      // Add new labels
      if (labelsToAdd.length > 0) {
        await fetch(`/api/emails/${emailId}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', labelIds: labelsToAdd })
        })
      }

      // Remove old labels
      if (labelsToRemove.length > 0) {
        await fetch(`/api/emails/${emailId}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', labelIds: labelsToRemove })
        })
      }

      onLabelsUpdate(emailId, selectedLabels)
      onClose()
    } catch (error) {
      console.error('Error updating labels:', error)
      alert('Failed to update labels')
    } finally {
      setApplying(false)
    }
  }

  const getLabelDisplayName = (label: Label) => {
    // Clean up system label names
    if (label.id.startsWith('CATEGORY_')) {
      return label.id.replace('CATEGORY_', '').toLowerCase()
    }
    return label.name
  }

  const getLabelColor = (label: Label) => {
    // Color coding for different label types
    if (label.id === 'IMPORTANT') return 'bg-yellow-500/20 text-yellow-300'
    if (label.id === 'STARRED') return 'bg-orange-500/20 text-orange-300'
    if (label.id.startsWith('CATEGORY_')) return 'bg-blue-500/20 text-blue-300'
    return 'bg-green-500/20 text-green-300' // User labels
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-96 max-h-[70vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-glass">Manage Labels</h3>
          <button
            onClick={onClose}
            className="glass-button text-glass p-2 rounded-full hover:scale-105 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading-circle"></div>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto mb-4 space-y-2">
              {availableLabels.map((label) => (
                <label
                  key={label.id}
                  className="flex items-center space-x-3 p-2 glass rounded-lg cursor-pointer hover:bg-white/10 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label.id)}
                    onChange={() => handleLabelToggle(label.id)}
                    className="w-4 h-4 text-blue-500 bg-transparent border-glass rounded focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 rounded-full text-xs ${getLabelColor(label)}`}>
                    {getLabelDisplayName(label)}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="glass-button text-glass px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="glass-button text-glass px-4 py-2 rounded-lg text-sm disabled:opacity-50 bg-blue-500/20"
              >
                {applying ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
                    <span>Applying...</span>
                  </div>
                ) : (
                  'Apply Labels'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}