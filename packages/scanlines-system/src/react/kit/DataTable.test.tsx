import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DataTable } from './DataTable'

afterEach(() => cleanup())

const cols = [{ key: 'role', header: 'Role' }, { key: 'perms', header: 'Permissions' }]

describe('DataTable', () => {
  // --- starter tests from brief ---

  it('renders rows with column headers (scope=col) and a caption', () => {
    render(<DataTable caption="Roles" columns={cols} rows={[{ role: 'admin', perms: '12' }]} rowKey={(r) => r.role} />)
    expect(screen.getByRole('columnheader', { name: 'Role' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('cell', { name: 'admin' })).toBeInTheDocument()
  })

  it('shows the empty slot when there are no rows', () => {
    render(<DataTable columns={cols} rows={[]} rowKey={() => 'x'} empty={<span>No roles</span>} />)
    expect(screen.getByText('No roles')).toBeInTheDocument()
  })

  // --- rows.length === 0 WITHOUT empty slot: falls through to empty table, no crash ---

  it('renders an empty table (no crash) when rows is empty and no empty slot given', () => {
    const { container } = render(<DataTable columns={cols} rows={[]} rowKey={() => 'x'} />)
    // table present, tbody has no rows
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
  })

  // --- caption: WITH and WITHOUT ---

  it('renders a <caption> element when caption prop is provided', () => {
    const { container } = render(
      <DataTable caption="My Table" columns={cols} rows={[{ role: 'x', perms: 'y' }]} rowKey={(r) => r.role} />
    )
    const caption = container.querySelector('caption')
    expect(caption).not.toBeNull()
    expect(caption).toHaveTextContent('My Table')
  })

  it('renders no <caption> element when caption prop is omitted', () => {
    const { container } = render(
      <DataTable columns={cols} rows={[{ role: 'x', perms: 'y' }]} rowKey={(r) => r.role} />
    )
    expect(container.querySelector('caption')).toBeNull()
  })

  // --- dense: true and false/omitted ---

  it('adds datatable--dense class when dense is true', () => {
    const { container } = render(
      <DataTable dense columns={cols} rows={[{ role: 'x', perms: 'y' }]} rowKey={(r) => r.role} />
    )
    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('datatable--dense')
  })

  it('omits datatable--dense class when dense is omitted', () => {
    const { container } = render(
      <DataTable columns={cols} rows={[{ role: 'x', perms: 'y' }]} rowKey={(r) => r.role} />
    )
    const wrapper = container.firstElementChild
    expect(wrapper).not.toHaveClass('datatable--dense')
  })

  // --- column WITH render fn AND without ---

  it('uses the render fn when column has one', () => {
    const colsWithRender = [
      { key: 'role', header: 'Role', render: (row: Record<string, unknown>) => <strong>{String(row.role)}</strong> },
    ]
    render(<DataTable columns={colsWithRender} rows={[{ role: 'admin' }]} rowKey={(r) => String(r.role)} />)
    expect(screen.getByRole('cell').querySelector('strong')).toBeInTheDocument()
  })

  it('falls back to String(row[key]) when column has no render fn', () => {
    render(<DataTable columns={cols} rows={[{ role: 'viewer', perms: '5' }]} rowKey={(r) => r.role} />)
    expect(screen.getByRole('cell', { name: 'viewer' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '5' })).toBeInTheDocument()
  })

  it('renders empty string for null/undefined cell values (the ?? "" branch)', () => {
    const { container } = render(
      <DataTable columns={cols} rows={[{ role: null, perms: undefined } as unknown as Record<string, unknown>]} rowKey={() => 'k'} />
    )
    const cells = container.querySelectorAll('tbody td')
    // both cells should be present and render empty string
    expect(cells).toHaveLength(2)
    expect(cells[0]).toHaveTextContent('')
    expect(cells[1]).toHaveTextContent('')
  })

  // --- align: WITH and WITHOUT (covers both <th> and <td> data-align attribute) ---

  it('sets data-align on <th> and <td> when align is specified', () => {
    const alignedCols = [{ key: 'amount', header: 'Amount', align: 'end' as const }]
    const { container } = render(
      <DataTable columns={alignedCols} rows={[{ amount: '100' }]} rowKey={() => 'r'} />
    )
    expect(container.querySelector('th')).toHaveAttribute('data-align', 'end')
    expect(container.querySelector('td')).toHaveAttribute('data-align', 'end')
  })

  it('defaults data-align to "start" on <th> and <td> when align is omitted', () => {
    const { container } = render(
      <DataTable columns={[{ key: 'role', header: 'Role' }]} rows={[{ role: 'admin' }]} rowKey={() => 'r'} />
    )
    expect(container.querySelector('th')).toHaveAttribute('data-align', 'start')
    expect(container.querySelector('td')).toHaveAttribute('data-align', 'start')
  })
})
