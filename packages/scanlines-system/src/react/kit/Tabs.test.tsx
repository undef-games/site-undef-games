import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Tabs } from './Tabs'

afterEach(() => cleanup())

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'settings', label: 'Settings' },
]

describe('Tabs', () => {
  it('renders a tablist with one tab button per item', () => {
    const onSelect = vi.fn()
    render(<Tabs tabs={tabs} activeId="overview" onSelect={onSelect} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('marks the active tab aria-selected=true and inactive tabs aria-selected=false', () => {
    const onSelect = vi.fn()
    render(<Tabs tabs={tabs} activeId="overview" onSelect={onSelect} />)
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onSelect with the tab id when an inactive tab is clicked', () => {
    const onSelect = vi.fn()
    render(<Tabs tabs={tabs} activeId="overview" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('settings')
  })
})
