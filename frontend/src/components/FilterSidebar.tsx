'use client'

import { useState } from 'react'

interface FilterOption {
  id: string
  label: string
  icon: string
  count?: number
  color?: string
}

interface FilterSidebarProps {
  selectedFilter: string
  onFilterChange: (filter: string) => void
  emailCounts?: Record<string, number>
  onRefresh?: () => void
}

export default function FilterSidebar({ selectedFilter, onFilterChange, emailCounts = {}, onRefresh }: FilterSidebarProps) {
  const filterOptions: FilterOption[] = [
    {
      id: 'all',
      label: 'All Mail',
      icon: '',
      count: emailCounts.all || 0,
      color: 'text-glass-dark'
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: '',
      count: emailCounts.inbox || 0,
      color: 'text-glass-dark'
    },
    {
      id: 'important',
      label: 'Important',
      icon: '',
      count: emailCounts.important || 0,
      color: 'text-glass-dark'
    },
    {
      id: 'unread',
      label: 'Unread',
      icon: '',
      count: emailCounts.unread || 0,
      color: 'text-glass-dark'
    }
  ]

  const categoryOptions: FilterOption[] = [
    {
      id: 'personal',
      label: 'Personal',
      icon: '',
      count: emailCounts.personal || 0,
      color: 'text-glass-dark'
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: '',
      count: emailCounts.updates || 0,
      color: 'text-glass-dark'
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: '',
      count: emailCounts.promotions || 0,
      color: 'text-glass-dark'
    }
  ]

  return (
    <div className="w-64 glass-card rounded-2xl p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-glass mb-1">Filters</h2>
        <p className="text-xs text-glass-dark">Organize your inbox</p>
      </div>

      {/* Main Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-glass-dark mb-3 uppercase tracking-wide">Main</h3>
        <div className="space-y-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selectedFilter === option.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-glass-dark hover:text-glass hover:bg-white/5'
              }`}
            >
              <div className="flex items-center">
                <span className={selectedFilter === option.id ? 'text-white' : option.color}>
                  {option.label}
                </span>
              </div>
              {option.count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedFilter === option.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-glass-dark'
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-glass-dark mb-3 uppercase tracking-wide">Categories</h3>
        <div className="space-y-1">
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selectedFilter === option.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-glass-dark hover:text-glass hover:bg-white/5'
              }`}
            >
              <div className="flex items-center">
                <span className={selectedFilter === option.id ? 'text-white' : option.color}>
                  {option.label}
                </span>
              </div>
              {option.count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedFilter === option.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-glass-dark'
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}