import type { ReactNode } from 'react'

export type Column<T> = { key: string; header: string; align?: 'start' | 'end' | 'center'; render?: (row: T) => ReactNode }
export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  dense?: boolean
  caption?: string
  empty?: ReactNode
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, rowKey, dense, caption, empty }: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <div className="datatable datatable--empty">{empty}</div>
  }
  return (
    <div className={['datatable', dense && 'datatable--dense'].filter(Boolean).join(' ')}>
      <table>
        {caption ? <caption className="datatable__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-align={c.align ?? 'start'}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} data-align={c.align ?? 'start'}>{c.render ? c.render(row) : String(row[c.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
